import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardStats } from "@/lib/database"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const stats = await getDashboardStats(session.user.id)

    return NextResponse.json({
      totalTrips: Number.parseInt(stats.total_trips) || 0,
      activeTrips: Number.parseInt(stats.active_trips) || 0,
      completedTrips: Number.parseInt(stats.completed_trips) || 0,
      totalBudget: Number.parseFloat(stats.total_budget) || 0,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
