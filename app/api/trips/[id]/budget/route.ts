import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { pool } from "@/lib/database"

const createBudgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  planned_amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().length(3, "Invalid currency code")
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

    // Verify trip ownership
    const tripCheck = await pool.query(
      `SELECT id FROM trips WHERE id = $1 AND user_id = $2`,
      [params.id, session.user.id]
    )

    if (tripCheck.rows.length === 0) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 })
    }

    const result = await pool.query(
      `SELECT * FROM budgets WHERE trip_id = $1 ORDER BY category`,
      [params.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching budgets:", error)
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
    const validationResult = createBudgetSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    // Check if budget category already exists for this trip
    const existingBudget = await pool.query(
      `SELECT id FROM budgets WHERE trip_id = $1 AND category = $2`,
      [params.id, validationResult.data.category]
    )

    if (existingBudget.rows.length > 0) {
      return NextResponse.json(
        { message: "Budget category already exists for this trip" },
        { status: 409 }
      )
    }

    const result = await pool.query(
      `INSERT INTO budgets (trip_id, category, planned_amount, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        params.id,
        validationResult.data.category,
        validationResult.data.planned_amount,
        validationResult.data.currency
      ]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating budget:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
