import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getPlatformStats, 
  getUserGrowthStats, 
  getTripGrowthStats, 
  getSystemMetrics,
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
    const type = searchParams.get("type") || "platform"

    switch (type) {
      case "platform":
        const platformStats = await getPlatformStats()
        return NextResponse.json(platformStats)

      case "userGrowth":
        const userGrowth = await getUserGrowthStats()
        return NextResponse.json(userGrowth)

      case "tripGrowth":
        const tripGrowth = await getTripGrowthStats()
        return NextResponse.json(tripGrowth)

      case "system":
        const systemMetrics = await getSystemMetrics()
        return NextResponse.json(systemMetrics)

      default:
        return NextResponse.json({ message: "Invalid stats type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
