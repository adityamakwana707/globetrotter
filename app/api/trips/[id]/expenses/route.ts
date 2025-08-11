import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { pool } from "@/lib/database"

const createExpenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0, "Amount must be positive"),
  currency: z.string().length(3, "Invalid currency code"),
  description: z.string().min(1, "Description is required"),
  expense_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  budget_id: z.string().uuid().optional()
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
      `SELECT * FROM expenses WHERE trip_id = $1 ORDER BY expense_date DESC, created_at DESC`,
      [params.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching expenses:", error)
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
    const validationResult = createExpenseSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO expenses (trip_id, budget_id, user_id, amount, currency, category, description, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        params.id,
        validationResult.data.budget_id || null,
        session.user.id,
        validationResult.data.amount,
        validationResult.data.currency,
        validationResult.data.category,
        validationResult.data.description,
        validationResult.data.expense_date
      ]
    )

    // Update budget spent amount if budget_id is provided
    if (validationResult.data.budget_id) {
      await pool.query(
        `UPDATE budgets 
         SET spent_amount = (
           SELECT COALESCE(SUM(amount), 0) 
           FROM expenses 
           WHERE budget_id = $1
         ),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [validationResult.data.budget_id]
      )
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
