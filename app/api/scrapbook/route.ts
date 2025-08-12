import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  createScrapbookEntry, 
  getScrapbookEntriesForUser 
} from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const entries = await getScrapbookEntriesForUser(session.user.id, limit, offset)
    return NextResponse.json({ success: true, data: entries, pagination: { limit, offset, hasMore: entries.length === limit } })
  } catch (error) {
    console.error("Error fetching scrapbook entries:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch scrapbook entries" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, images } = body || {}

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 })
    }

    const entry = await createScrapbookEntry({ user_id: session.user.id, title, content, images })
    return NextResponse.json({ success: true, data: entry })
  } catch (error) {
    console.error("Error creating scrapbook entry:", error)
    return NextResponse.json({ success: false, error: "Failed to create scrapbook entry" }, { status: 500 })
  }
}


