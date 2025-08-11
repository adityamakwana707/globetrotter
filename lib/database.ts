import { Pool } from "pg"

// Enhanced database connection with performance tuning
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Performance tuning
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Test database connection with enhanced error handling
pool.on('error', (err) => {
  console.error('❌ Database connection error:', err)
})

// Enhanced connection test with performance metrics
export async function testConnection() {
  const startTime = Date.now()
  try {
    const client = await pool.connect()
    
    // Test basic connectivity
    await client.query('SELECT NOW()')
    
    // Test performance with a simple query
    const perfResult = await client.query('SELECT COUNT(*) FROM users LIMIT 1')
    
    client.release()
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    console.log(`✅ Database connected successfully in ${responseTime}ms`)
    console.log(`📊 Performance: ${perfResult.rows[0]?.count || 0} users found`)
    
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// ============================================================================
// ENHANCED INTERFACES WITH HYBRID ID SYSTEM
// ============================================================================

export interface User {
  id: string // UUID for auth
  display_id: number // Auto-increment for display
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  city?: string
  country?: string
  profile_image?: string
  email_verified: boolean
  role: 'user' | 'admin' | 'moderator'
  last_login_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Trip {
  id: number // Auto-increment for performance
  display_id: number // Auto-increment for public URLs
  user_id: string // UUID for auth
  name: string
  description: string
  start_date: Date
  end_date: Date
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
  share_token?: string
  allow_copy: boolean
  share_expires_at?: Date
  created_at: Date
  updated_at: Date
}

export interface City {
  id: number // Auto-increment for performance
  display_id: number // Auto-increment for public URLs
  name: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  description?: string
  image_url?: string
  cost_index: number
  popularity_score: number
  created_at: Date
}

export interface Activity {
  id: number // Auto-increment for performance
  display_id: number // Auto-increment for public URLs
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  city_id: number
  latitude?: number
  longitude?: number
  image_url?: string
  website_url?: string
  created_at: Date
}

// ============================================================================
// PERFORMANCE-OPTIMIZED USER OPERATIONS
// ============================================================================

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Use prepared statement for security and performance
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error in getUserByEmail:", error)
    throw error
  }
}

export async function getUserByDisplayId(displayId: number): Promise<User | null> {
  try {
    // Fast lookup using display_id index
    const result = await pool.query(
      "SELECT * FROM users WHERE display_id = $1",
      [displayId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error in getUserByDisplayId:", error)
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
    console.error("Database error in createUser:", error)
    throw error
  }
}

// ============================================================================
// PERFORMANCE-OPTIMIZED TRIP OPERATIONS
// ============================================================================

export async function getUserTrips(userId: string, limit?: number): Promise<Trip[]> {
  try {
    // Use composite index (user_id, status) for optimal performance
    const query = limit
      ? "SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"
      : "SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC"

    const params = limit ? [userId, limit] : [userId]
    const result = await pool.query(query, params)
    
    // Auto-update statuses based on current date
    const updatedTrips = result.rows.map(trip => {
      const now = new Date()
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      
      let correctStatus = 'planning'
      if (now >= startDate && now <= endDate) {
        correctStatus = 'active'
      } else if (now > endDate) {
        correctStatus = 'completed'
      }
      
      // Update in database if status is incorrect (fire and forget)
      if (trip.status !== correctStatus) {
        pool.query(
          "UPDATE trips SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [correctStatus, trip.id]
        ).catch(err => console.error('Error auto-updating trip status:', err))
        
        // Return updated trip object
        return { ...trip, status: correctStatus }
      }
      
      return trip
    })
    
    return updatedTrips
  } catch (error) {
    console.error("Database error in getUserTrips:", error)
    throw error
  }
}



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
    // Auto-calculate status based on dates
    const now = new Date()
    const startDate = new Date(tripData.startDate)
    const endDate = new Date(tripData.endDate)
    
    let autoStatus = 'planning'
    if (now >= startDate && now <= endDate) {
      autoStatus = 'active'
    } else if (now > endDate) {
      autoStatus = 'completed'
    }
    
    const result = await pool.query(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, status, cover_image, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, display_id, user_id, name, description, start_date, end_date, status, cover_image, is_public, share_token, allow_copy, share_expires_at, created_at, updated_at`,
      [
        tripData.userId,
        tripData.name,
        tripData.description,
        tripData.startDate,
        tripData.endDate,
        tripData.status || autoStatus,
        tripData.coverImage,
        tripData.isPublic || false,
      ],
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error in createTrip:", error)
    throw error
  }
}

export async function updateTrip(tripId: number, userId: string, tripData: Partial<{
  name: string
  description: string
  startDate: string
  endDate: string
  status: string
  coverImage: string
  isPublic: boolean
}>): Promise<Trip> {
  try {
    // Build dynamic update query for better performance
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (tripData.name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(tripData.name)
    }
    if (tripData.description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(tripData.description)
    }
    if (tripData.startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`)
      values.push(tripData.startDate)
    }
    if (tripData.endDate !== undefined) {
      updates.push(`end_date = $${paramCount++}`)
      values.push(tripData.endDate)
    }
    if (tripData.status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(tripData.status)
    }
    if (tripData.coverImage !== undefined) {
      updates.push(`cover_image = $${paramCount++}`)
      values.push(tripData.coverImage)
    }
    if (tripData.isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`)
      values.push(tripData.isPublic)
    }

    if (updates.length === 0) {
      throw new Error("No fields to update")
    }

    // Add tripId and userId to values array
    values.push(tripId, userId)

    const result = await pool.query(
      `UPDATE trips 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING id, display_id, user_id, name, description, start_date, end_date, status, cover_image, is_public, share_token, allow_copy, share_expires_at, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error("Trip not found or access denied")
    }

    return result.rows[0]
  } catch (error) {
    console.error("Database error in updateTrip:", error)
    throw error
  }
}

export async function deleteTrip(tripId: number, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "DELETE FROM trips WHERE id = $1 AND user_id = $2",
      [tripId, userId]
    )
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error in deleteTrip:", error)
    throw error
  }
}

export async function getTripById(tripId: number, userId: string): Promise<Trip | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE id = $1 AND user_id = $2",
      [tripId, userId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error in getTripById:", error)
    throw error
  }
}

export async function getTripByDisplayId(displayId: number, userId: string): Promise<Trip | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE display_id = $1 AND user_id = $2",
      [displayId, userId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error in getTripByDisplayId:", error)
    throw error
  }
}

export async function updateTripByDisplayId(displayId: number, userId: string, tripData: Partial<{
  name: string
  description: string
  startDate: string
  endDate: string
  status: string
  coverImage: string
  isPublic: boolean
}>): Promise<Trip> {
  try {
    // First get the trip to get the internal ID
    const trip = await getTripByDisplayId(displayId, userId)
    if (!trip) {
      throw new Error("Trip not found or access denied")
    }
    
    // Now update using the internal ID
    return await updateTrip(trip.id, userId, tripData)
  } catch (error) {
    console.error("Database error in updateTripByDisplayId:", error)
    throw error
  }
}

export async function deleteTripByDisplayId(displayId: number, userId: string): Promise<boolean> {
  try {
    // First get the trip to get the internal ID
    const trip = await getTripByDisplayId(displayId, userId)
    if (!trip) {
      return false
    }
    
    // Now delete using the internal ID
    return await deleteTrip(trip.id, userId)
  } catch (error) {
    console.error("Database error in deleteTripByDisplayId:", error)
    throw error
  }
}

export async function updateTripById(tripId: number, userId: string, tripData: Partial<{
  name: string
  description: string
  startDate: string
  endDate: string
  status: string
  coverImage: string
  isPublic: boolean
}>): Promise<Trip> {
  try {
    return await updateTrip(tripId, userId, tripData)
  } catch (error) {
    console.error("Database error in updateTripById:", error)
    throw error
  }
}

export async function deleteTripById(tripId: number, userId: string): Promise<boolean> {
  try {
    return await deleteTrip(tripId, userId)
  } catch (error) {
    console.error("Database error in deleteTripById:", error)
    throw error
  }
}

export async function duplicateTrip(tripId: number, userId: string, newName: string): Promise<Trip> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get original trip
    const originalTrip = await client.query(
      "SELECT * FROM trips WHERE id = $1 AND user_id = $2",
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
       RETURNING id, display_id, user_id, name, description, start_date, end_date, status, cover_image, is_public, share_token, allow_copy, share_expires_at, created_at, updated_at`,
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

// ============================================================================
// PERFORMANCE-OPTIMIZED CITY & ACTIVITY OPERATIONS
// ============================================================================

export async function getCities(search?: string, limit: number = 50): Promise<City[]> {
  try {
    // Simple, reliable query structure
    if (search && search.trim()) {
      // Search with explicit parameter casting
      const searchTerm = `%${search.trim()}%`
      const result = await pool.query(
        `SELECT id, display_id, name, country, latitude, longitude, timezone, 
                description, image_url, cost_index, popularity_score, created_at
         FROM cities 
         WHERE name ILIKE $1::text OR country ILIKE $1::text OR COALESCE(description, '') ILIKE $1::text
         ORDER BY popularity_score DESC, name ASC 
         LIMIT $2::integer`,
        [searchTerm, limit]
      )
      return result.rows
    } else {
      // No search - get popular cities
      const result = await pool.query(
        `SELECT id, display_id, name, country, latitude, longitude, timezone, 
                description, image_url, cost_index, popularity_score, created_at
         FROM cities 
         ORDER BY popularity_score DESC, name ASC 
         LIMIT $1::integer`,
        [limit]
      )
      return result.rows
    }
  } catch (error) {
    console.error("Database error in getCities:", error)
    // Return empty array to prevent UI breaks, but log the error
    return []
  }
}

export async function getActivities(cityId?: number, search?: string, limit: number = 50): Promise<Activity[]> {
  try {
    let query = "SELECT * FROM activities"
    let params: any[] = []
    let whereConditions: string[] = []

    if (cityId) {
      whereConditions.push("city_id = $" + (params.length + 1))
      params.push(cityId)
    }

    if (search) {
      // Use full-text search index for optimal performance
      whereConditions.push(`to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '')) @@ plainto_tsquery('english', $${params.length + 1})`)
      params.push(search)
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ")
    }

    query += " ORDER BY rating DESC NULLS LAST, name ASC LIMIT $" + (params.length + 1)
    params.push(limit)

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database error in getActivities:", error)
    throw error
  }
}

export async function getTripCities(tripId: number): Promise<any[]> {
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

export async function getTripActivities(tripId: number): Promise<any[]> {
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
  tripId: number
  cityId: number
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
  tripId: number
  activityId: number
  tripCityId?: number
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

export async function removeTripCity(tripCityId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      "DELETE FROM trip_cities WHERE id = $1",
      [tripCityId]
    )
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function removeTripActivity(tripActivityId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      "DELETE FROM trip_activities WHERE id = $1",
      [tripActivityId]
    )
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// ============================================================================
// PERFORMANCE-OPTIMIZED DASHBOARD OPERATIONS
// ============================================================================

export async function getDashboardStats(userId: string) {
  try {
    // Use a single query with multiple aggregations for better performance
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_trips,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trips,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
        COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_trips,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 
          (end_date - start_date) END), 0) as total_active_days
       FROM trips 
       WHERE user_id = $1`,
      [userId]
    )

    return result.rows[0]
  } catch (error) {
    console.error("Database error in getDashboardStats:", error)
    throw error
  }
}

export async function getPopularCities(limit: number = 10): Promise<City[]> {
  try {
    // Use materialized view for optimal performance
    const result = await pool.query(
      `SELECT * FROM popular_cities 
       ORDER BY popularity_score DESC, trip_count DESC 
       LIMIT $1`,
      [limit]
    )
    return result.rows
  } catch (error) {
    console.error("Database error in getPopularCities:", error)
    // Fallback to regular query if materialized view doesn't exist
    const result = await pool.query(
      `SELECT c.*, COUNT(tc.trip_id) as trip_count
       FROM cities c
       LEFT JOIN trip_cities tc ON c.id = tc.city_id
       GROUP BY c.id
       ORDER BY c.popularity_score DESC, trip_count DESC
       LIMIT $1`,
      [limit]
    )
    return result.rows
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    )
    return result.rows[0]?.role === 'admin'
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    await pool.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
      [userId]
    )
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getPlatformStats(): Promise<any> {
  try {
    // Refresh materialized view first
    await pool.query('REFRESH MATERIALIZED VIEW platform_stats')
    
    const result = await pool.query('SELECT * FROM platform_stats')
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getUserAnalytics(limit?: number, offset?: number): Promise<any[]> {
  try {
    // Refresh materialized view first
    await pool.query('REFRESH MATERIALIZED VIEW user_analytics')
    
    let query = 'SELECT * FROM user_analytics'
    const params = []
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`
      params.push(limit)
      
      if (offset) {
        query += ` OFFSET $${params.length + 1}`
        params.push(offset)
      }
    }
    
    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getPopularCitiesAdmin(): Promise<any[]> {
  try {
    // Refresh materialized view first
    await pool.query('REFRESH MATERIALIZED VIEW popular_cities')
    
    const result = await pool.query('SELECT * FROM popular_cities LIMIT 20')
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getPopularActivitiesAdmin(): Promise<any[]> {
  try {
    // Refresh materialized view first
    await pool.query('REFRESH MATERIALIZED VIEW popular_activities')
    
    const result = await pool.query('SELECT * FROM popular_activities LIMIT 20')
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getUserGrowthStats(): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as total_users
      FROM users 
      WHERE role = 'user'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getTripGrowthStats(): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_trips,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_trips,
        SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as total_trips
      FROM trips 
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [role, userId]
    )
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function searchUsers(query: string, limit: number = 50): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        id, display_id, email, first_name, last_name, role, 
        created_at, last_login_at
      FROM users 
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
      AND role != 'admin'
      ORDER BY created_at DESC
      LIMIT $2
    `, [`%${query}%`, limit])
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getSystemMetrics(): Promise<any> {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM trips WHERE created_at >= CURRENT_DATE) as trips_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as users_today,
        (SELECT COUNT(*) FROM expenses WHERE expense_date >= CURRENT_DATE) as expenses_today,
        (SELECT COUNT(*) FROM shared_trips WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as shares_7d,
        (SELECT ROUND(AVG(rating), 2) FROM activities WHERE rating IS NOT NULL) as avg_activity_rating,
        (SELECT COUNT(*) FROM trip_activities WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as activities_added_7d
    `)
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// ============================================================================
// CONNECTION POOL MANAGEMENT
// ============================================================================

export async function closePool() {
  try {
    await pool.end()
    console.log('✅ Database connection pool closed successfully')
  } catch (error) {
    console.error('❌ Error closing database pool:', error)
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  await closePool()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  await closePool()
  process.exit(0)
})