import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getPopularCitiesAdmin,
  getPopularActivitiesAdmin,
  isUserAdmin 
} from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    switch (type) {
      case "cities":
        const popularCities = await getPopularCitiesAdmin()
        return NextResponse.json(popularCities)

      case "activities":
        const popularActivities = await getPopularActivitiesAdmin()
        return NextResponse.json(popularActivities)

      default:
        return NextResponse.json({ 
          cities: await getPopularCitiesAdmin(),
          activities: await getPopularActivitiesAdmin()
        })
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
