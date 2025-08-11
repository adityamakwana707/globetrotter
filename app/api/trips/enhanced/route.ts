import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/enhanced-database"
import { z } from "zod"

// Enhanced validation schema with better error messages
const createTripSchema = z.object({
  name: z.string()
    .min(1, "Trip name is required")
    .max(255, "Trip name must be less than 255 characters")
    .trim(),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .default(""),
  startDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date format")
    .refine((date) => new Date(date) >= new Date().setHours(0, 0, 0, 0), "Start date cannot be in the past"),
  endDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date format"),
  status: z.enum(["planning", "active", "completed"])
    .optional()
    .default("planning"),
  coverImage: z.string()
    .refine((val) => {
      if (!val || val.trim() === "") return true
      return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://')
    }, "Invalid image path or URL")
    .optional(),
  isPublic: z.boolean()
    .optional()
    .default(false)
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

// Enhanced GET endpoint with pagination, filtering, and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC'

    // Validate sortBy parameter to prevent SQL injection
    const allowedSortFields = ['created_at', 'start_date', 'end_date', 'name', 'status']
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { message: "Invalid sort field" },
        { status: 400 }
      )
    }

    // Build dynamic query with proper indexing
    let query = `
      SELECT 
        t.id,
        t.display_id,
        t.name,
        t.description,
        t.start_date,
        t.end_date,
        t.status,
        t.cover_image,
        t.is_public,
        t.created_at,
        t.updated_at,
        COUNT(tc.city_id) as city_count,
        COUNT(ta.activity_id) as activity_count
      FROM trips t
      LEFT JOIN trip_cities tc ON t.id = tc.trip_id
      LEFT JOIN trip_activities ta ON t.id = ta.trip_id
      WHERE t.user_id = $1
    `
    
    const params: any[] = [session.user.id]
    let paramCount = 1

    // Add status filter if provided
    if (status && ['planning', 'active', 'completed'].includes(status)) {
      paramCount++
      query += ` AND t.status = $${paramCount}`
      params.push(status)
    }

    // Add search filter if provided
    if (search && search.trim()) {
      paramCount++
      query += ` AND (
        t.name ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount}
      )`
      params.push(`%${search.trim()}%`)
    }

    // Group by to get accurate counts
    query += ` GROUP BY t.id, t.display_id, t.name, t.description, t.start_date, t.end_date, t.status, t.cover_image, t.is_public, t.created_at, t.updated_at`

    // Add sorting
    query += ` ORDER BY t.${sortBy} ${sortOrder}`

    // Add pagination
    paramCount++
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    params.push(limit, (page - 1) * limit)

    // Execute query
    const result = await pool.query(query, params)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM trips t
      WHERE t.user_id = $1
    `
    const countParams: any[] = [session.user.id]
    paramCount = 1

    if (status && ['planning', 'active', 'completed'].includes(status)) {
      paramCount++
      countQuery += ` AND t.status = $${paramCount}`
      countParams.push(status)
    }

    if (search && search.trim()) {
      paramCount++
      countQuery += ` AND (
        t.name ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount}
      )`
      countParams.push(`%${search.trim()}%`)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      trips: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json(
      { message: "Failed to fetch trips" },
      { status: 500 }
    )
  }
}

// Enhanced POST endpoint with better validation and error handling
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log("Received trip data:", body)

    // Validate input data
    const validationResult = createTripSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors)
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const tripData = validationResult.data

    // Use transaction for data integrity
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Insert trip with enhanced data
      const tripResult = await client.query(
        `INSERT INTO trips (
          user_id, name, description, start_date, end_date, 
          status, cover_image, is_public
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          session.user.id,
          tripData.name,
          tripData.description,
          tripData.startDate,
          tripData.endDate,
          tripData.status,
          tripData.coverImage,
          tripData.isPublic
        ]
      )

      const newTrip = tripResult.rows[0]

      // Log successful creation
      console.log(`✅ Trip created successfully: ID ${newTrip.id}, Display ID ${newTrip.display_id}`)

      await client.query('COMMIT')

      return NextResponse.json(
        {
          message: "Trip created successfully",
          trip: {
            id: newTrip.id,
            display_id: newTrip.display_id,
            name: newTrip.name,
            description: newTrip.description,
            start_date: newTrip.start_date,
            end_date: newTrip.end_date,
            status: newTrip.status,
            cover_image: newTrip.cover_image,
            is_public: newTrip.is_public,
            created_at: newTrip.created_at
          }
        },
        { status: 201 }
      )

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { 
        message: "Failed to create trip",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
