import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { pool } from "@/lib/database"
import { randomBytes } from "crypto"

const shareSettingsSchema = z.object({
  isPublic: z.boolean(),
  allowCopy: z.boolean().optional().default(false),
  expiresAt: z.string().optional().nullable()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get trip sharing settings
    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.description, t.is_public, t.share_token, t.allow_copy, t.share_expires_at,
        u.name as owner_name
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [params.id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    const trip = result.rows[0]
    
    return NextResponse.json({
      id: trip.id,
      name: trip.name,
      description: trip.description,
      isPublic: trip.is_public,
      shareToken: trip.share_token,
      allowCopy: trip.allow_copy,
      shareExpiresAt: trip.share_expires_at,
      ownerName: trip.owner_name,
      shareUrl: trip.share_token ? `${process.env.NEXTAUTH_URL}/shared/${trip.share_token}` : null
    })
  } catch (error) {
    console.error("Error fetching trip sharing settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Verify trip ownership
    const tripCheck = await pool.query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [params.id, session.user.id]
    )

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = shareSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const { isPublic, allowCopy, expiresAt } = validationResult.data

    // Generate share token if making public and doesn't have one
    let shareToken = null
    if (isPublic) {
      const existingToken = await pool.query(
        `SELECT share_token FROM trips WHERE id = $1`,
        [params.id]
      )
      
      if (existingToken.rows[0]?.share_token) {
        shareToken = existingToken.rows[0].share_token
      } else {
        shareToken = randomBytes(32).toString('hex')
      }
    }

    // Update trip sharing settings
    const result = await pool.query(
      `UPDATE trips 
       SET 
         is_public = $1,
         share_token = $2,
         allow_copy = $3,
         share_expires_at = $4,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        isPublic,
        shareToken,
        allowCopy,
        expiresAt ? new Date(expiresAt) : null,
        params.id,
        session.user.id
      ]
    )

    const trip = result.rows[0]

    return NextResponse.json({
      id: trip.id,
      isPublic: trip.is_public,
      shareToken: trip.share_token,
      allowCopy: trip.allow_copy,
      shareExpiresAt: trip.share_expires_at,
      shareUrl: trip.share_token ? `${process.env.NEXTAUTH_URL}/shared/${trip.share_token}` : null
    })
  } catch (error) {
    console.error("Error updating trip sharing settings:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
