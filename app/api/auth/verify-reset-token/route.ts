import { NextRequest, NextResponse } from "next/server"
import { verifyPasswordResetToken } from "@/lib/database"
import { z } from "zod"

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyTokenSchema.parse(body)

    // Verify the reset token
    const isValid = await verifyPasswordResetToken(token)

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Token is valid"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Verify token error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
