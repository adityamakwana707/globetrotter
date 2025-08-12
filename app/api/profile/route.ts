import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import { z } from "zod"

const updateProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone_number: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { first_name, last_name, phone_number, city, country } = validationResult.data

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone_number = $3, city = $4, country = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, first_name, last_name, phone_number, city, country, email, role, email_verified, created_at, updated_at`,
      [first_name, last_name, phone_number, city, country, session.user.id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = result.rows[0]

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone_number: updatedUser.phone_number,
        city: updatedUser.city,
        country: updatedUser.country,
        role: updatedUser.role,
        email_verified: updatedUser.email_verified,
      }
    })

  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile data
    const result = await pool.query(
      `SELECT id, first_name, last_name, phone_number, city, country, email, role, email_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = result.rows[0]

    return NextResponse.json({
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        city: user.city,
        country: user.country,
        role: user.role,
        email_verified: user.email_verified,
      }
    })

  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
