import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [session.user.id]
    )

    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all activities with city information and booking counts
    const activities = await pool.query(`
      SELECT 
        a.*,
        c.name as city_name,
        c.country as city_country,
        COUNT(DISTINCT ta.trip_id) as booking_count
      FROM activities a
      JOIN cities c ON a.city_id = c.id
      LEFT JOIN trip_activities ta ON a.id = ta.activity_id
      GROUP BY a.id, c.name, c.country
      ORDER BY a.name ASC
    `)

    return NextResponse.json(activities.rows)
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [session.user.id]
    )

    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      estimated_cost,
      duration_hours,
      difficulty_level,
      min_group_size,
      max_group_size,
      image_url,
      city_id
    } = body

    if (!name || !city_id) {
      return NextResponse.json({ error: "Name and city are required" }, { status: 400 })
    }

    // Verify city exists
    const cityCheck = await pool.query("SELECT id FROM cities WHERE id = $1", [city_id])
    if (cityCheck.rows.length === 0) {
      return NextResponse.json({ error: "City not found" }, { status: 400 })
    }

    // Insert new activity
    const result = await pool.query(`
      INSERT INTO activities (
        name, description, category, price_range, duration_hours,
        city_id, image_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [
      name,
      description || null,
      category || null,
      estimated_cost ? `$${estimated_cost}` : null, // Convert to price_range format
      duration_hours || null,
      city_id,
      image_url || null
    ])

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [session.user.id]
    )

    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      category,
      estimated_cost,
      duration_hours,
      difficulty_level,
      min_group_size,
      max_group_size,
      image_url,
      city_id
    } = body

    if (!id || !name || !city_id) {
      return NextResponse.json({ error: "ID, name and city are required" }, { status: 400 })
    }

    // Verify city exists
    const cityCheck = await pool.query("SELECT id FROM cities WHERE id = $1", [city_id])
    if (cityCheck.rows.length === 0) {
      return NextResponse.json({ error: "City not found" }, { status: 400 })
    }

    // Update activity
    const result = await pool.query(`
      UPDATE activities SET 
        name = $1,
        description = $2,
        category = $3,
        price_range = $4,
        duration_hours = $5,
        image_url = $6,
        city_id = $7
      WHERE id = $8
      RETURNING *
    `, [
      name,
      description || null,
      category || null,
      estimated_cost ? `$${estimated_cost}` : null, // Convert to price_range format
      duration_hours || null,
      image_url || null,
      city_id,
      id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [session.user.id]
    )

    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 })
    }

    // Check if activity has related data
    const relatedData = await pool.query(`
      SELECT 
        COUNT(DISTINCT ta.trip_id) as trip_count
      FROM trip_activities ta
      WHERE ta.activity_id = $1
    `, [id])

    const { trip_count } = relatedData.rows[0]

    if (trip_count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete activity that is part of existing trips" 
      }, { status: 400 })
    }

    // Delete activity
    const result = await pool.query("DELETE FROM activities WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Activity deleted successfully" })
  } catch (error) {
    console.error("Error deleting activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
