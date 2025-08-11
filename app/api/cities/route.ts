import { type NextRequest, NextResponse } from "next/server"
import { getCities } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const country = searchParams.get("country")

    const cities = await getCities(search || undefined, limit)

    // Apply additional filters if needed
    let filteredCities = cities
    if (country && country !== "all") {
      filteredCities = cities.filter(city => city.country === country)
    }

    return NextResponse.json(filteredCities)
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
