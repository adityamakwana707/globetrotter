import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTripCities, addTripCity, getCityById, createCity } from "@/lib/database"
import { z } from "zod"

// Accept either an existing numeric cityId OR a name/country pair to auto-create
const addTripCitySchema = z.object({
  cityId: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  orderIndex: z.number().int().min(0, "Order index must be non-negative").default(0),
  arrivalDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid arrival date").optional(),
  departureDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), "Invalid departure date").optional()
}).refine((data) => {
  // Require either cityId OR both name and country
  if (!data.cityId && !(data.name && data.country)) return false
  // Validate date order if both present
  if (data.arrivalDate && data.departureDate) {
    const arrival = new Date(data.arrivalDate)
    const departure = new Date(data.departureDate)
    return arrival <= departure
  }
  return true
}, {
  message: "Provide either a valid cityId or both name and country. If both dates provided, departure must be after arrival.",
  path: ["cityId"]
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

    const tripId = parseInt(params.id)
    if (Number.isNaN(tripId)) return NextResponse.json({ message: "Invalid trip id" }, { status: 400 })

    const cities = await getTripCities(tripId)
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

    const tripId = parseInt(params.id)
    if (Number.isNaN(tripId)) return NextResponse.json({ message: "Invalid trip id" }, { status: 400 })

    const body = await request.json()
    const parsed = addTripCitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "Validation failed", errors: parsed.error.errors }, { status: 400 })
    }

    let cityId = parsed.data.cityId

    // If name/country provided instead of cityId → geocode and create city
    if (!cityId && parsed.data.name && parsed.data.country) {
      try {
        // Try our internal geocode API (OpenStreetMap Nominatim)
        const q = `${parsed.data.name}, ${parsed.data.country}`
        const geoResp = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/geocode?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        const results = geoResp.ok ? await geoResp.json() : []
        const top = Array.isArray(results) && results.length > 0 ? results[0] : null

        const latitude = top?.latitude ?? null
        const longitude = top?.longitude ?? null

        // Create city in DB
        const created = await createCity({
          name: parsed.data.name,
          country: parsed.data.country,
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          timezone: 'Etc/UTC',
        })
        cityId = created.id
      } catch (e) {
        console.warn('Auto-geocode failed; creating city without coordinates')
        const created = await createCity({
          name: parsed.data.name,
          country: parsed.data.country,
          latitude: 0,
          longitude: 0,
          timezone: 'Etc/UTC',
        })
        cityId = created.id
      }
    }

    if (!cityId) {
      return NextResponse.json({ message: "City could not be resolved" }, { status: 400 })
    }

    // Ensure city exists
    const city = await getCityById(cityId)
    if (!city) return NextResponse.json({ message: "City not found" }, { status: 404 })

    const tripCity = await addTripCity({
      tripId,
      cityId,
      orderIndex: parsed.data.orderIndex ?? 0,
      arrivalDate: parsed.data.arrivalDate,
      departureDate: parsed.data.departureDate,
    })

    return NextResponse.json(tripCity, { status: 201 })
  } catch (error) {
    console.error("Error adding trip city:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
