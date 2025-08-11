import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredPasswordResets } from "@/lib/database"

// This endpoint can be called by a cron job to clean up expired tokens
// In production, protect this endpoint with a secret key
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify secret key for security
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CLEANUP_SECRET_KEY
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    await cleanupExpiredPasswordResets()
    
    return NextResponse.json({
      message: "Expired password reset tokens cleaned up successfully"
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
