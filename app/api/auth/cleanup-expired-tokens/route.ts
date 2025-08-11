import { NextRequest, NextResponse } from "next/server"
import { cleanupExpiredPasswordResets, cleanupExpiredEmailVerificationOTPs, cleanupExpiredUnverifiedUsers } from "@/lib/database"

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

    // Clean up expired password reset tokens
    await cleanupExpiredPasswordResets()
    
    // Clean up expired email verification OTPs
    await cleanupExpiredEmailVerificationOTPs()
    
    // Clean up expired unverified users (older than 24 hours)
    await cleanupExpiredUnverifiedUsers()

    return NextResponse.json({
      message: "Cleanup completed successfully"
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
