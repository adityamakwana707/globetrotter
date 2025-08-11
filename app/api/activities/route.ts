import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getActivities } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get("cityId")
    const search = searchParams.get("search")

    const activities = await getActivities(cityId || undefined, search || undefined)

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
