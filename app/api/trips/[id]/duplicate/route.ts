import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { duplicateTrip } from "@/lib/database"
import { z } from "zod"

const duplicateTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long")
})

export async function POST(
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
    const validationResult = duplicateTripSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const newTrip = await duplicateTrip(params.id, session.user.id, validationResult.data.name)

    return NextResponse.json(newTrip, { status: 201 })
  } catch (error) {
    console.error("Error duplicating trip:", error)
    if (error instanceof Error && error.message === 'Trip not found or unauthorized') {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
