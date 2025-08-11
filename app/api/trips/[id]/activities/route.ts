import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTripActivities, addTripActivity } from "@/lib/database"
import { z } from "zod"

const addTripActivitySchema = z.object({
  activityId: z.string().uuid("Invalid activity ID"),
  tripCityId: z.string().uuid("Invalid trip city ID").optional(),
  scheduledDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid scheduled date").optional(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional(),
  orderIndex: z.number().int().min(0, "Order index must be non-negative").optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  estimatedCost: z.number().min(0, "Estimated cost must be non-negative").optional()
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

    const activities = await getTripActivities(params.id)

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching trip activities:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

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
    const validationResult = addTripActivitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const tripActivityData = {
      tripId: params.id,
      ...validationResult.data
    }

    const tripActivity = await addTripActivity(tripActivityData)

    return NextResponse.json(tripActivity, { status: 201 })
  } catch (error) {
    console.error("Error adding trip activity:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
