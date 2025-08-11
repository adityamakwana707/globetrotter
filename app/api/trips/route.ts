import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserTrips, createTrip, storeTripItinerary } from "@/lib/database"
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
  isPublic: z.boolean().optional().default(false),
  // Additional fields from comprehensive trip builder
  destinations: z.array(z.string()).optional().default([]),
  totalBudget: z.number().optional().default(0),
  currency: z.string().optional().default("USD"),
  itinerary: z.array(z.any()).optional().default([]) // Accept any itinerary structure for now
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

    // Auto-calculate status based on dates
    const now = new Date()
    const startDate = new Date(validationResult.data.startDate)
    const endDate = new Date(validationResult.data.endDate)
    
    let autoStatus = 'planning'
    if (now >= startDate && now <= endDate) {
      autoStatus = 'active'
    } else if (now > endDate) {
      autoStatus = 'completed'
    }

    const tripData = {
      userId: session.user.id,
      ...validationResult.data,
      status: autoStatus // Override with auto-calculated status
    }

    const trip = await createTrip(tripData)

    // Store itinerary if provided
    if (validationResult.data.itinerary && validationResult.data.itinerary.length > 0) {
      try {
        console.log("Received itinerary data:", validationResult.data.itinerary)
        
        // Validate itinerary structure
        const validItinerary = validationResult.data.itinerary.filter((day: any) => {
          if (!day || typeof day !== 'object') {
            console.log("Invalid day object:", day)
            return false
          }
          
          if (!day.date) {
            console.log("Day missing date:", day)
            return false
          }
          
          // Day headers without activities are valid
          if (!day.activities || !Array.isArray(day.activities)) {
            console.log(`Day ${day.date} has no activities array - this is a valid day header`)
            return true
          }
          
          // If day has activities, they should have valid IDs
          if (day.activities.length > 0) {
            const validActivities = day.activities.filter((activity: any) => {
              if (!activity || typeof activity !== 'object') {
                console.log("Invalid activity object:", activity)
                return false
              }
              
              if (!activity.id || typeof activity.id !== 'number' || activity.id <= 0) {
                console.log("Activity missing valid ID:", activity)
                return false
              }
              
              return true
            })
            
            if (validActivities.length === 0) {
              console.log(`Day ${day.date} has no valid activities - keeping as day header only`)
              // Remove invalid activities but keep the day
              day.activities = []
            } else {
              // Update day with only valid activities
              day.activities = validActivities
            }
          }
          
          return true
        })
        
        if (validItinerary.length > 0) {
          console.log(`Storing ${validItinerary.length} valid itinerary days`)
          await storeTripItinerary(trip.id, validItinerary)
        } else {
          console.log("No valid itinerary days to store")
        }
      } catch (error) {
        console.error("Error storing itinerary:", error)
        // Don't fail the trip creation if itinerary storage fails
      }
    }

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { message: "Failed to create trip" }, 
      { status: 500 }
    )
  }
}
