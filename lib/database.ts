import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Test database connection on startup
pool.on('error', (err) => {
  console.error('Database connection error:', err)
})

// Simple connection test
export async function testConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

export interface User {
  id: string
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  city?: string
  country?: string
  created_at: Date
  updated_at: Date
}

export interface Trip {
  id: string
  user_id: string
  name: string
  description: string
  start_date: Date
  end_date: Date
  status: "planning" | "active" | "completed"
  cover_image?: string
  created_at: Date
  updated_at: Date
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function createUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  city?: string
  country?: string
}): Promise<User> {
  try {
    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, phone_number, city, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.city,
        userData.country,
      ],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getUserTrips(userId: string, limit?: number): Promise<Trip[]> {
  try {
    const query = limit
      ? "SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"
      : "SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC"

    const params = limit ? [userId, limit] : [userId]
    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getDashboardStats(userId: string) {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_trips,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trips,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
        COALESCE(SUM(b.planned_amount), 0) as total_budget
       FROM trips t
       LEFT JOIN budgets b ON t.id = b.trip_id
       WHERE t.user_id = $1`,
      [userId],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// Trip CRUD operations
export async function createTrip(tripData: {
  userId: string
  name: string
  description: string
  startDate: string
  endDate: string
  status?: string
  coverImage?: string
  isPublic?: boolean
}): Promise<Trip> {
  try {
    const result = await pool.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, status, cover_image, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tripData.userId,
        tripData.name,
        tripData.description,
        tripData.startDate,
        tripData.endDate,
        tripData.status || 'planning',
        tripData.coverImage,
        tripData.isPublic || false,
      ],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function updateTrip(tripId: string, userId: string, tripData: Partial<{
  name: string
  description: string
  startDate: string
  endDate: string
  status: string
  coverImage: string
  isPublic: boolean
}>): Promise<Trip> {
  try {
    const fields = []
    const values = []
    let paramCount = 1

    if (tripData.name !== undefined) {
      fields.push(`name = $${paramCount}`)
      values.push(tripData.name)
      paramCount++
    }
    if (tripData.description !== undefined) {
      fields.push(`description = $${paramCount}`)
      values.push(tripData.description)
      paramCount++
    }
    if (tripData.startDate !== undefined) {
      fields.push(`start_date = $${paramCount}`)
      values.push(tripData.startDate)
      paramCount++
    }
    if (tripData.endDate !== undefined) {
      fields.push(`end_date = $${paramCount}`)
      values.push(tripData.endDate)
      paramCount++
    }
    if (tripData.status !== undefined) {
      fields.push(`status = $${paramCount}`)
      values.push(tripData.status)
      paramCount++
    }
    if (tripData.coverImage !== undefined) {
      fields.push(`cover_image = $${paramCount}`)
      values.push(tripData.coverImage)
      paramCount++
    }
    if (tripData.isPublic !== undefined) {
      fields.push(`is_public = $${paramCount}`)
      values.push(tripData.isPublic)
      paramCount++
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(tripId, userId)

    const result = await pool.query(
      `UPDATE trips SET ${fields.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values,
    )
    
    if (result.rows.length === 0) {
      throw new Error('Trip not found or unauthorized')
    }
    
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function deleteTrip(tripId: string, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `DELETE FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, userId]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getTripById(tripId: string, userId: string): Promise<Trip | null> {
  try {
    const result = await pool.query(
      `SELECT * FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, userId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function duplicateTrip(tripId: string, userId: string, newName: string): Promise<Trip> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get original trip
    const originalTrip = await client.query(
      `SELECT * FROM trips WHERE id = $1 AND user_id = $2`,
      [tripId, userId]
    )

    if (originalTrip.rows.length === 0) {
      throw new Error('Trip not found or unauthorized')
    }

    const trip = originalTrip.rows[0]

    // Create new trip
    const newTrip = await client.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, status, cover_image, is_public)
       VALUES ($1, $2, $3, $4, $5, 'planning', $6, $7)
       RETURNING *`,
      [
        userId,
        newName,
        trip.description,
        trip.start_date,
        trip.end_date,
        trip.cover_image,
        trip.is_public,
      ]
    )

    const newTripId = newTrip.rows[0].id

    // Copy trip cities
    await client.query(
      `INSERT INTO trip_cities (trip_id, city_id, order_index, arrival_date, departure_date)
       SELECT $1, city_id, order_index, arrival_date, departure_date
       FROM trip_cities WHERE trip_id = $2`,
      [newTripId, tripId]
    )

    // Copy trip activities
    await client.query(
      `INSERT INTO trip_activities (trip_id, activity_id, trip_city_id, scheduled_date, scheduled_time, order_index, notes, estimated_cost)
       SELECT $1, activity_id, 
              (SELECT new_tc.id FROM trip_cities new_tc 
               JOIN trip_cities old_tc ON new_tc.city_id = old_tc.city_id 
               WHERE new_tc.trip_id = $1 AND old_tc.id = ta.trip_city_id),
              scheduled_date, scheduled_time, order_index, notes, estimated_cost
       FROM trip_activities ta WHERE trip_id = $2`,
      [newTripId, tripId]
    )

    // Copy budgets
    await client.query(
      `INSERT INTO budgets (trip_id, category, planned_amount, currency)
       SELECT $1, category, planned_amount, currency
       FROM budgets WHERE trip_id = $2`,
      [newTripId, tripId]
    )

    await client.query('COMMIT')
    return newTrip.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Database error:", error)
    throw error
  } finally {
    client.release()
  }
}

// City and Activity management
export async function getCities(search?: string): Promise<any[]> {
  try {
    let query = `SELECT * FROM cities`
    const params = []
    
    if (search) {
      query += ` WHERE name ILIKE $1 OR country ILIKE $1 ORDER BY name`
      params.push(`%${search}%`)
    } else {
      query += ` ORDER BY name LIMIT 50`
    }

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getActivities(cityId?: string, search?: string): Promise<any[]> {
  try {
    let query = `SELECT * FROM activities`
    const params = []
    const conditions = []
    
    if (cityId) {
      conditions.push(`city_id = $${params.length + 1}`)
      params.push(cityId)
    }
    
    if (search) {
      conditions.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`)
      params.push(`%${search}%`)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY name LIMIT 50`

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getTripCities(tripId: string): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT tc.*, c.name, c.country, c.latitude, c.longitude, c.timezone, c.image_url
       FROM trip_cities tc
       JOIN cities c ON tc.city_id = c.id
       WHERE tc.trip_id = $1
       ORDER BY tc.order_index`,
      [tripId]
    )
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getTripActivities(tripId: string): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT ta.*, a.name, a.description, a.category, a.price_range, a.rating, a.duration_hours, a.image_url
       FROM trip_activities ta
       JOIN activities a ON ta.activity_id = a.id
       WHERE ta.trip_id = $1
       ORDER BY ta.order_index`,
      [tripId]
    )
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function addTripCity(tripData: {
  tripId: string
  cityId: string
  orderIndex: number
  arrivalDate?: string
  departureDate?: string
}): Promise<any> {
  try {
    const result = await pool.query(
      `INSERT INTO trip_cities (trip_id, city_id, order_index, arrival_date, departure_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        tripData.tripId,
        tripData.cityId,
        tripData.orderIndex,
        tripData.arrivalDate,
        tripData.departureDate,
      ]
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function addTripActivity(activityData: {
  tripId: string
  activityId: string
  tripCityId?: string
  scheduledDate?: string
  scheduledTime?: string
  orderIndex?: number
  notes?: string
  estimatedCost?: number
}): Promise<any> {
  try {
    const result = await pool.query(
      `INSERT INTO trip_activities (trip_id, activity_id, trip_city_id, scheduled_date, scheduled_time, order_index, notes, estimated_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        activityData.tripId,
        activityData.activityId,
        activityData.tripCityId,
        activityData.scheduledDate,
        activityData.scheduledTime,
        activityData.orderIndex,
        activityData.notes,
        activityData.estimatedCost,
      ]
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function removeTripCity(tripCityId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `DELETE FROM trip_cities WHERE id = $1`,
      [tripCityId]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function removeTripActivity(tripActivityId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `DELETE FROM trip_activities WHERE id = $1`,
      [tripActivityId]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}
