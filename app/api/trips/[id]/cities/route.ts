import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTripCities, addTripCity } from "@/lib/database"
import { z } from "zod"

const addTripCitySchema = z.object({
  cityId: z.string().uuid("Invalid city ID"),
  orderIndex: z.number().int().min(0, "Order index must be non-negative"),
  arrivalDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid arrival date").optional(),
  departureDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid departure date").optional()
}).refine((data) => {
  if (data.arrivalDate && data.departureDate) {
    const arrival = new Date(data.arrivalDate)
    const departure = new Date(data.departureDate)
    return arrival <= departure
  }
  return true
}, {
  message: "Departure date must be after arrival date",
  path: ["departureDate"]
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

    const cities = await getTripCities(params.id)

    return NextResponse.json(cities)
  } catch (error) {
    console.error("Error fetching trip cities:", error)
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
    const validationResult = addTripCitySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const tripCityData = {
      tripId: params.id,
      ...validationResult.data
    }

    const tripCity = await addTripCity(tripCityData)

    return NextResponse.json(tripCity, { status: 201 })
  } catch (error) {
    console.error("Error adding trip city:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
