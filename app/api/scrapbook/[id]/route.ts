import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteScrapbookEntry } from "@/lib/database"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const entryId = parseInt(params.id)
    if (isNaN(entryId)) {
      return NextResponse.json({ success: false, error: "Invalid entry ID" }, { status: 400 })
    }

    const success = await deleteScrapbookEntry(entryId, session.user.id)
    
    if (success) {
      return NextResponse.json({ success: true, message: "Entry deleted successfully" })
    } else {
      return NextResponse.json({ success: false, error: "Entry not found or unauthorized" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting scrapbook entry:", error)
    return NextResponse.json({ success: false, error: "Failed to delete entry" }, { status: 500 })
  }
}
