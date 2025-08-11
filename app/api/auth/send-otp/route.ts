import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUnverifiedUserByEmail, createEmailVerificationOTP } from "@/lib/database"
import { sendEmailVerificationOTP } from "@/lib/email"
import { forgotPasswordRateLimit } from "@/lib/rate-limit"

const sendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    if (!forgotPasswordRateLimit.isAllowed(ip)) {
      const remainingTime = Math.ceil(forgotPasswordRateLimit.getRemainingTime(ip) / 1000 / 60)
      return NextResponse.json(
        { message: `Too many requests. Try again in ${remainingTime} minutes.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = sendOTPSchema.parse(body)

    // Check if unverified user exists
    const unverifiedUser = await getUnverifiedUserByEmail(email)
    if (!unverifiedUser) {
      return NextResponse.json(
        { message: "No pending verification found for this email" },
        { status: 404 }
      )
    }

    // Generate and send OTP
    const otpCode = await createEmailVerificationOTP(unverifiedUser.id, email)
    await sendEmailVerificationOTP(email, otpCode, unverifiedUser.first_name)

    return NextResponse.json({
      message: "OTP sent successfully",
      email: email
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
