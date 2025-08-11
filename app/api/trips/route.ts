import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserTrips, createTrip } from "@/lib/database"
import { z } from "zod"

// Validation schemas
const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long"),
  description: z.string().max(1000, "Description too long").optional().default(""),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  status: z.enum(["planning", "active", "completed"]).optional().default("planning"),
  coverImage: z.string().refine((val) => {
    if (!val || val.trim() === "") return true; // Allow empty strings
    // Allow relative paths starting with / or full URLs
    return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://');
  }, "Invalid image path or URL").optional(),
  isPublic: z.boolean().optional().default(false)
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit")

    const trips = await getUserTrips(session.user.id, limit ? Number.parseInt(limit) : undefined)

    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received trip data:", body)
    
    // Validate request body
    const validationResult = createTripSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors)
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const tripData = {
      userId: session.user.id,
      ...validationResult.data
    }

    const trip = await createTrip(tripData)

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { message: "Failed to create trip" }, 
      { status: 500 }
    )
  }
}
