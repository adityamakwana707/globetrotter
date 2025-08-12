import { type NextRequest, NextResponse } from "next/server"
import { getActivities } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get("cityId")
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const priceRange = searchParams.get("priceRange")
    const limit = parseInt(searchParams.get("limit") || "50")

    let activities = await getActivities(
      cityId ? parseInt(cityId) : undefined, 
      search || undefined, 
      limit
    )

    // Apply additional filters
    if (category && category !== "all") {
      activities = activities.filter(activity => 
        activity.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (priceRange && priceRange !== "all") {
      activities = activities.filter(activity => 
        activity.price_range?.toLowerCase() === priceRange.toLowerCase()
      )
    }

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
