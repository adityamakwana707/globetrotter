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

    // Get all cities with trip counts
    const cities = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT tc.trip_id) as trip_count
      FROM cities c
      LEFT JOIN trip_cities tc ON c.id = tc.city_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `)

    return NextResponse.json(cities.rows)
  } catch (error) {
    console.error("Error fetching cities:", error)
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
      country,
      description,
      image_url,
      latitude,
      longitude,
      timezone,
      cost_index
    } = body

    if (!name || !country) {
      return NextResponse.json({ error: "Name and country are required" }, { status: 400 })
    }

    // Check if city already exists
    const existingCity = await pool.query(
      "SELECT id FROM cities WHERE LOWER(name) = LOWER($1) AND LOWER(country) = LOWER($2)",
      [name, country]
    )

    if (existingCity.rows.length > 0) {
      return NextResponse.json({ error: "City already exists" }, { status: 400 })
    }

    // Insert new city
    const result = await pool.query(`
      INSERT INTO cities (
        name, country, description, image_url, latitude, longitude, 
        timezone, cost_index
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      country,
      description || null,
      image_url || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      timezone || null,
      cost_index ? parseInt(cost_index) : 50
    ])

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error creating city:", error)
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
      country,
      description,
      image_url,
      latitude,
      longitude,
      timezone,
      cost_index
    } = body

    if (!id || !name || !country) {
      return NextResponse.json({ error: "ID, name and country are required" }, { status: 400 })
    }

    // Update city
    const result = await pool.query(`
      UPDATE cities SET 
        name = $1,
        country = $2,
        description = $3,
        image_url = $4,
        latitude = $5,
        longitude = $6,
        timezone = $7,
        cost_index = $8
      WHERE id = $9
      RETURNING *
    `, [
      name,
      country,
      description || null,
      image_url || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      timezone || null,
      cost_index ? parseInt(cost_index) : 50,
      id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating city:", error)
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
      return NextResponse.json({ error: "City ID is required" }, { status: 400 })
    }

    // Check if city has related data
    const relatedData = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM activities WHERE city_id = $1) as activity_count,
        (SELECT COUNT(*) FROM trip_cities WHERE city_id = $1) as trip_count
    `, [id])

    const { activity_count, trip_count } = relatedData.rows[0]

    if (activity_count > 0 || trip_count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete city with associated activities or trips" 
      }, { status: 400 })
    }

    // Delete city
    const result = await pool.query("DELETE FROM cities WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "City deleted successfully" })
  } catch (error) {
    console.error("Error deleting city:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
