import { NextRequest, NextResponse } from "next/server"
import { resetUserPassword } from "@/lib/database"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Reset the password
    const success = await resetUserPassword(token, password)

    if (!success) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Password has been reset successfully"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Reset password error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
