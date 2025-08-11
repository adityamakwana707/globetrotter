import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, createPasswordResetToken } from "@/lib/database"
import { sendPasswordResetEmail } from "@/lib/email"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await getUserByEmail(email)
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "If an account with that email exists, we've sent a password reset link."
      })
    }

    // Generate reset token
    const resetToken = await createPasswordResetToken(user.id)

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.first_name)
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError)
      return NextResponse.json(
        { message: "Failed to send password reset email. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link."
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Forgot password error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
