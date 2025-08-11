import { NextRequest, NextResponse } from "next/server"
import { verifyEmailVerificationOTP, getUnverifiedUserByEmail } from "@/lib/database"
import { z } from "zod"

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otpCode: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otpCode } = verifyOTPSchema.parse(body)

    // Get the unverified user first
    const unverifiedUser = await getUnverifiedUserByEmail(email)
    if (!unverifiedUser) {
      return NextResponse.json(
        { message: "No pending verification found for this email" },
        { status: 404 }
      )
    }

    // Verify the OTP
    const result = await verifyEmailVerificationOTP(unverifiedUser.id, email, otpCode)

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid or expired OTP code" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Email verified successfully! You can now login.",
      user: result.user,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("OTP verification error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
