import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTripById, updateTrip, deleteTrip, duplicateTrip } from "@/lib/database"
import { z } from "zod"

// Validation schemas
const updateTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date").optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date").optional(),
  status: z.enum(["planning", "active", "completed"]).optional(),
  coverImage: z.string().refine((val) => {
    if (!val || val.trim() === "") return true; // Allow empty strings
    // Allow relative paths starting with / or full URLs
    return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://');
  }, "Invalid image path or URL").optional(),
  isPublic: z.boolean().optional()
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return start <= end
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

const duplicateTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long")
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const trip = await getTripById(params.id, session.user.id)

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error fetching trip:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateTripSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const trip = await updateTrip(params.id, session.user.id, validationResult.data)

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error updating trip:", error)
    if (error instanceof Error && error.message === 'Trip not found or unauthorized') {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const success = await deleteTrip(params.id, session.user.id)

    if (!success) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Trip deleted successfully" })
  } catch (error) {
    console.error("Error deleting trip:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
