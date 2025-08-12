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
  id: string // UUID for internal operations
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

export async function deleteTrip(tripId: string, userId: string): Promise<boolean> {
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

export async function getTripById(tripId: string, userId: string): Promise<Trip | null> {
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
    return await updateTrip(String(tripId), userId, tripData)
  } catch (error) {
    console.error("Database error in updateTripById:", error)
    throw error
  }
}

export async function deleteTripById(tripId: string, userId: string): Promise<boolean> {
  try {
    return await deleteTrip(tripId, userId)
  } catch (error) {
    console.error("Database error in deleteTripById:", error)
    throw error
  }
}

export async function duplicateTrip(tripId: string | number, userId: string, newName: string): Promise<Trip> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get original trip
    const originalTrip = await client.query(
      "SELECT * FROM trips WHERE id = $1 AND user_id = $2",
      [String(tripId), userId]
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
      [newTripId, String(tripId)]
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

export async function getTripBudgets(tripId: number): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM budgets WHERE trip_id = $1 ORDER BY category`,
      [tripId]
    )
    return result.rows
  } catch (error) {
    console.error("Database error in getTripBudgets:", error)
    throw error
  }
}

export async function getTripExpenses(tripId: number): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM expenses WHERE trip_id = $1 ORDER BY expense_date DESC`,
      [tripId]
    )
    return result.rows
  } catch (error) {
    console.error("Database error in getTripExpenses:", error)
    throw error
  }
}

// Comprehensive function to get all trip details with related data
export async function getComprehensiveTripDetails(tripId: number, userId: string): Promise<{
  trip: Trip | null,
  cities: any[],
  activities: any[],
  budgets: any[],
  expenses: any[],
  destinations: string[],
  itinerary: any[]
}> {
  try {
    // Fetch basic trip info using display_id
    const trip = await getTripByDisplayId(tripId, userId)
    
    if (!trip) {
      return {
        trip: null,
        cities: [],
        activities: [],
        budgets: [],
        expenses: [],
        destinations: [],
        itinerary: []
      }
    }

    // Fetch all related data in parallel for better performance
    // Use display_id for database functions that expect numeric trip_id
    const [cities, activities, budgets, expenses, itinerary] = await Promise.all([
      getTripCities(trip.display_id), // Use display_id directly
      getTripActivities(trip.display_id), // Use display_id directly
      getTripBudgets(trip.display_id), // Use display_id directly
      getTripExpenses(trip.display_id), // Use display_id directly
      getTripItinerary(trip.display_id) // Use display_id directly
    ])

    // Extract destinations from cities
    const destinations = cities.map(city => city.name)

    return {
      trip,
      cities,
      activities,
      budgets,
      expenses,
      destinations,
      itinerary
    }
  } catch (error) {
    console.error("Database error in getComprehensiveTripDetails:", error)
    throw error
  }
}

// Store daily itinerary efficiently using existing tables
export async function storeTripItinerary(tripId: number, itineraryDays: any[]) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Ensure table for day headers exists (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS itinerary_days (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        date DATE NOT NULL,
        title TEXT,
        description TEXT,
        location_name TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_date ON itinerary_days(trip_id, date);

      CREATE TABLE IF NOT EXISTS itinerary_entries (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        scheduled_time TIME,
        title TEXT NOT NULL,
        notes TEXT,
        order_index INTEGER,
        estimated_cost DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_itinerary_entries_trip_date ON itinerary_entries(trip_id, date);
    `)

    // Clear previous entries
    await client.query('DELETE FROM itinerary_days WHERE trip_id = $1', [tripId])
    await client.query('DELETE FROM trip_activities WHERE trip_id = $1', [tripId])

    let totalActivitiesStored = 0
    for (const day of itineraryDays) {
      // Insert day header
      await client.query(
        `INSERT INTO itinerary_days (trip_id, day_number, date, title, description, location_name)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tripId,
          typeof day.dayNumber === 'number' ? day.dayNumber : 1,
          day.date,
          day.title || null,
          day.description || null,
          day?.location?.name || null,
        ]
      )

      if (day.activities && Array.isArray(day.activities) && day.activities.length > 0) {
        for (const activity of day.activities) {
          if (activity?.id && typeof activity.id === 'number' && activity.id > 0) {
            let estimatedCost = 0
            if (typeof activity.estimatedCost === 'number') estimatedCost = activity.estimatedCost
            else if (activity.price_range) estimatedCost = String(activity.price_range).length * 25

            await client.query(
              `INSERT INTO trip_activities (
                trip_id, activity_id, scheduled_date, scheduled_time,
                order_index, notes, estimated_cost, trip_city_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                tripId,
                activity.id,
                day.date,
                activity.startTime || '09:00:00',
                activity.orderIndex || 1,
                activity.notes || '',
                estimatedCost,
                null,
              ]
            )
            totalActivitiesStored++
          } else if (activity && (activity.name || activity.title)) {
            // Store free-form entry not in catalog
            let estimatedCost = 0
            if (typeof activity.estimatedCost === 'number') estimatedCost = activity.estimatedCost
            else if (activity.price_range) estimatedCost = String(activity.price_range).length * 25
            await client.query(
              `INSERT INTO itinerary_entries (trip_id, date, scheduled_time, title, notes, order_index, estimated_cost)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                tripId,
                day.date,
                activity.startTime || null,
                activity.name || activity.title,
                activity.notes || null,
                activity.orderIndex || 1,
                estimatedCost || 0,
              ]
            )
          }
        }
      } else {
        // No catalog activities; persist a single entry if day has meaningful content
        const hasMeaning = (day.title && day.title.trim() !== '') || (day.description && day.description.trim() !== '') || (day.notes && day.notes.trim() !== '') || (day.budget && day.budget.estimated)
        if (hasMeaning) {
          await client.query(
            `INSERT INTO itinerary_entries (trip_id, date, scheduled_time, title, notes, order_index, estimated_cost)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              tripId,
              day.date,
              day.startTime || null,
              day.title || 'Itinerary Item',
              day.description || day.notes || null,
              day.dayNumber || 1,
              (day.budget && typeof day.budget.estimated === 'number') ? day.budget.estimated : 0,
            ]
          )
        }
      }
    }

    await client.query('COMMIT')
    console.log(`Stored itinerary: ${itineraryDays.length} days, ${totalActivitiesStored} activities`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error storing itinerary:', error)
    throw error
  } finally {
    client.release()
  }
}

// Fetch comprehensive itinerary using existing tables
export async function getTripItinerary(tripId: number): Promise<any[]> {
  try {
    // Ensure supporting tables exist (in case script hasn't been run for this env/DB)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS itinerary_days (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        date DATE NOT NULL,
        title TEXT,
        description TEXT,
        location_name TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_date ON itinerary_days(trip_id, date);

      CREATE TABLE IF NOT EXISTS itinerary_entries (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        scheduled_time TIME,
        title TEXT NOT NULL,
        notes TEXT,
        order_index INTEGER,
        estimated_cost DECIMAL(10,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_itinerary_entries_trip_date ON itinerary_entries(trip_id, date);
    `)

    const dayRows = await pool.query(`
      SELECT id, trip_id, day_number, date, title, description, location_name
      FROM itinerary_days
      WHERE trip_id = $1
      ORDER BY date, day_number
    `, [tripId]).catch(() => ({ rows: [] as any[] }))

    const activitiesResult = await pool.query(`
      SELECT 
        ta.*, 
        a.name, 
        a.description, 
        a.category, 
        a.price_range,
        tc.city_id,
        c.name as city_name,
        c.country,
        c.latitude,
        c.longitude
      FROM trip_activities ta
      LEFT JOIN activities a ON ta.activity_id = a.id
      LEFT JOIN trip_cities tc ON ta.trip_city_id = tc.id
      LEFT JOIN cities c ON tc.city_id = c.id
      WHERE ta.trip_id = $1 
        AND ta.activity_id IS NOT NULL
      ORDER BY ta.scheduled_date, ta.order_index
    `, [tripId])

    const customEntriesResult = await pool.query(`
      SELECT id, trip_id, date as scheduled_date, scheduled_time, title as name, notes as description,
             NULL::text as category, NULL::text as price_range, NULL::int as city_id, NULL::text as city_name,
             NULL::text as country, NULL::float as latitude, NULL::float as longitude,
             order_index, estimated_cost
      FROM itinerary_entries
      WHERE trip_id = $1
      ORDER BY date, order_index
    `, [tripId])

    const activitiesByDate = new Map<string, any[]>()
    for (const a of activitiesResult.rows) {
      const key = String(a.scheduled_date)
      if (!activitiesByDate.has(key)) activitiesByDate.set(key, [])
      activitiesByDate.get(key)!.push(a)
    }
    for (const e of customEntriesResult.rows) {
      const key = String(e.scheduled_date)
      if (!activitiesByDate.has(key)) activitiesByDate.set(key, [])
      activitiesByDate.get(key)!.push(e)
    }

    if (dayRows.rows.length > 0) {
      return dayRows.rows.map((d, idx) => {
        const dayActivities = activitiesByDate.get(String(d.date)) || []
        const estimated = dayActivities.reduce((s, x) => s + (x.estimated_cost ? parseFloat(x.estimated_cost) : 0), 0)
        const first = dayActivities[0]
        return {
          id: `day-${d.date}`,
          dayNumber: d.day_number || idx + 1,
          title: d.title || `Day ${d.day_number || idx + 1}`,
          description: d.description || `Activities for ${new Date(d.date).toLocaleDateString()}`,
          date: d.date,
          startTime: '09:00:00',
          location: {
            name: d.location_name || first?.city_name || 'Unknown',
            coordinates: first?.latitude && first?.longitude ? { lat: first.latitude, lng: first.longitude } : undefined,
          },
          activityType: 'sightseeing',
          budget: { estimated, breakdown: [] },
          activities: dayActivities,
          completed: false,
        }
      })
    }

    // Fallback: build from activities and custom entries only
    const daysMap = new Map<string, any>()
    const merged = [...activitiesResult.rows, ...customEntriesResult.rows]
    for (const activity of merged) {
      const dateKey = activity.scheduled_date
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, {
          id: `day-${dateKey}`,
          dayNumber: daysMap.size + 1,
          title: `Day ${daysMap.size + 1}`,
          description: `Activities for ${new Date(dateKey).toLocaleDateString()}`,
          date: dateKey,
          startTime: '09:00:00',
          location: {
            name: activity.city_name || 'Unknown',
            coordinates: activity.latitude && activity.longitude ? { lat: activity.latitude, lng: activity.longitude } : undefined
          },
          activityType: 'sightseeing',
          budget: { estimated: 0, breakdown: [] },
          activities: [],
          completed: false,
        })
      }
      const day = daysMap.get(dateKey)!
      day.activities.push(activity)
      if (activity.estimated_cost) day.budget.estimated += parseFloat(activity.estimated_cost)
    }
    return Array.from(daysMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error("Database error in getTripItinerary:", error)
    return []
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

// Password Reset Functions
export async function createPasswordResetToken(userId: string): Promise<string> {
  const crypto = require('crypto')
  const token = crypto.randomUUID().replace(/-/g, '') // Generate a secure random token
  const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

  // Clean up any existing expired tokens for this user
  await pool.query(
    `DELETE FROM password_resets 
     WHERE user_id = $1 AND (expires_at <= CURRENT_TIMESTAMP OR used = TRUE)`,
    [userId]
  )

  // Insert new token
  await pool.query(
    `INSERT INTO password_resets (user_id, token, expires_at) 
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  )

  return token
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT user_id FROM password_resets 
     WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
    [token]
  )

  return result.rows.length > 0 ? result.rows[0].user_id : null
}

export async function resetUserPassword(token: string, newPassword: string): Promise<boolean> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Verify token and get user ID
    const tokenResult = await client.query(
      `SELECT user_id FROM password_resets 
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
      [token]
    )

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return false
    }

    const userId = tokenResult.rows[0].user_id

    // Hash the new password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    )

    // Mark token as used
    await client.query(
      'UPDATE password_resets SET used = TRUE WHERE token = $1',
      [token]
    )

    await client.query('COMMIT')
    return true

  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Password reset error:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function cleanupExpiredPasswordResets(): Promise<void> {
  await pool.query(
    'DELETE FROM password_resets WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE'
  )
}

// ============================================================================
// UNVERIFIED USER MANAGEMENT FUNCTIONS
// ============================================================================

export async function createUnverifiedUser(userData: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  city?: string
  country?: string
}): Promise<string> {
  const client = await pool.connect()
  
  try {
    // Generate a temporary user ID
    const tempUserId = crypto.randomUUID()
    
    // Insert into unverified_users table
    await client.query(
      `INSERT INTO unverified_users (
        id, email, password, first_name, last_name, phone_number, city, country, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
      [
        tempUserId,
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber || null,
        userData.city || null,
        userData.country || null,
      ]
    )
    
    return tempUserId
  } finally {
    client.release()
  }
}

export async function getUnverifiedUserById(userId: string): Promise<any | null> {
  const result = await pool.query(
    'SELECT * FROM unverified_users WHERE id = $1',
    [userId]
  )
  
  return result.rows[0] || null
}

export async function getUnverifiedUserByEmail(email: string): Promise<any | null> {
  const result = await pool.query(
    'SELECT * FROM unverified_users WHERE email = $1',
    [email]
  )
  
  return result.rows[0] || null
}

export async function moveUnverifiedUserToVerified(userId: string): Promise<User> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Get unverified user data
    const unverifiedUser = await getUnverifiedUserById(userId)
    if (!unverifiedUser) {
      throw new Error('Unverified user not found')
    }
    
    // Create verified user
    const verifiedUser = await createUser({
      email: unverifiedUser.email,
      password: unverifiedUser.password, // Already hashed
      firstName: unverifiedUser.first_name,
      lastName: unverifiedUser.last_name,
      phoneNumber: unverifiedUser.phone_number,
      city: unverifiedUser.city,
      country: unverifiedUser.country,
    })
    
    // Delete from unverified_users
    await client.query('DELETE FROM unverified_users WHERE id = $1', [userId])
    
    await client.query('COMMIT')
    return verifiedUser
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function cleanupExpiredUnverifiedUsers(): Promise<void> {
  // Delete unverified users older than 24 hours
  await pool.query(
    'DELETE FROM unverified_users WHERE created_at < CURRENT_TIMESTAMP - INTERVAL \'24 hours\''
  )
}

// ============================================================================
// EMAIL VERIFICATION OTP FUNCTIONS
// ============================================================================

export async function createEmailVerificationOTP(userId: string, email: string): Promise<string> {
  const client = await pool.connect()
  
  try {
    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    // Delete any existing OTP for this user/email
    await client.query(
      "DELETE FROM email_verification_otps WHERE user_id = $1 AND email = $2",
      [userId, email]
    )
    
    // Insert new OTP
    await client.query(
      "INSERT INTO email_verification_otps (user_id, email, otp_code, expires_at) VALUES ($1, $2, $3, $4)",
      [userId, email, otpCode, expiresAt]
    )
    
    return otpCode
  } finally {
    client.release()
  }
}

export async function verifyEmailVerificationOTP(userId: string, email: string, otpCode: string): Promise<{ success: boolean; user?: User }> {
  const client = await pool.connect()
  
  try {
    const result = await client.query(
      `SELECT * FROM email_verification_otps 
       WHERE user_id = $1 AND email = $2 AND otp_code = $3 AND expires_at > NOW() AND used_at IS NULL`,
      [userId, email, otpCode]
    )
    
    if (result.rows.length === 0) {
      return { success: false }
    }
    
    // Mark OTP as used
    await client.query(
      "UPDATE email_verification_otps SET used_at = NOW() WHERE user_id = $1 AND email = $2",
      [userId, email]
    )
    
    // Move unverified user to verified users table
    const verifiedUser = await moveUnverifiedUserToVerified(userId)
    
    return { success: true, user: verifiedUser }
  } finally {
    client.release()
  }
}

export async function cleanupExpiredEmailVerificationOTPs(): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query(
      "DELETE FROM email_verification_otps WHERE expires_at < NOW()"
    )
  } finally {
    client.release()
  }
}

// ============================================================================
// CONTENT MANAGEMENT FUNCTIONS (ADMIN)
// ============================================================================

// City Management Functions
export async function getAllCities(limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, country, latitude, longitude, timezone, 
        description, cost_index, popularity_score, created_at, updated_at,
        (SELECT COUNT(*) FROM trips t JOIN trip_cities tc ON t.id = tc.trip_id WHERE tc.city_id = cities.id) as trip_count
      FROM cities 
      ORDER BY popularity_score DESC, name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset])
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getCityById(cityId: number): Promise<any | null> {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, country, latitude, longitude, timezone, 
        description, cost_index, popularity_score, created_at, updated_at,
        (SELECT COUNT(*) FROM trips t JOIN trip_cities tc ON t.id = tc.trip_id WHERE tc.city_id = cities.id) as trip_count,
        (SELECT COUNT(*) FROM activities WHERE city_id = cities.id) as activity_count
      FROM cities 
      WHERE id = $1
    `, [cityId])
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function findCityByName(name: string): Promise<any | null> {
  try {
    const result = await pool.query(
      "SELECT * FROM cities WHERE LOWER(name) = LOWER($1)",
      [name]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error in findCityByName:", error)
    throw error
  }
}

export async function createCity(cityData: {
  name: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  description?: string
  cost_index?: number
  popularity_score?: number
}): Promise<any> {
  try {
    const result = await pool.query(`
      INSERT INTO cities (name, country, latitude, longitude, timezone, description, cost_index, popularity_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      cityData.name,
      cityData.country,
      cityData.latitude,
      cityData.longitude,
      cityData.timezone,
      cityData.description || null,
      cityData.cost_index || 50,
      cityData.popularity_score || 0
    ])
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function updateCity(cityId: number, updateData: {
  name?: string
  country?: string
  latitude?: number
  longitude?: number
  timezone?: string
  description?: string
  cost_index?: number
  popularity_score?: number
}): Promise<any | null> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    })

    if (fields.length === 0) {
      return null
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(cityId)

    const query = `
      UPDATE cities 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function deleteCity(cityId: number): Promise<boolean> {
  try {
    // Check if city has associated trips or activities
    const checkResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM trip_cities WHERE city_id = $1) as trip_count,
        (SELECT COUNT(*) FROM activities WHERE city_id = $1) as activity_count
    `, [cityId])

    const { trip_count, activity_count } = checkResult.rows[0]

    if (trip_count > 0 || activity_count > 0) {
      throw new Error("Cannot delete city: has associated trips or activities")
    }

    const result = await pool.query('DELETE FROM cities WHERE id = $1', [cityId])
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// Activity Management Functions
export async function getAllActivities(limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.name, a.description, a.category, a.price_range, a.rating, 
        a.duration_hours, a.latitude, a.longitude, a.created_at, a.updated_at,
        c.name as city_name, c.country,
        (SELECT COUNT(*) FROM trip_activities ta WHERE ta.activity_id = a.id) as booking_count
      FROM activities a
      LEFT JOIN cities c ON a.city_id = c.id
      ORDER BY a.rating DESC, a.name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset])
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getActivityById(activityId: number): Promise<any | null> {
  try {
    const result = await pool.query(`
      SELECT 
        a.*, c.name as city_name, c.country,
        (SELECT COUNT(*) FROM trip_activities ta WHERE ta.activity_id = a.id) as booking_count
      FROM activities a
      LEFT JOIN cities c ON a.city_id = c.id
      WHERE a.id = $1
    `, [activityId])
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function createActivity(activityData: {
  name: string
  description: string
  category: string
  price_range: string
  rating?: number
  duration_hours?: number
  city_id: number
  latitude?: number
  longitude?: number
}): Promise<any> {
  try {
    const result = await pool.query(`
      INSERT INTO activities (name, description, category, price_range, rating, duration_hours, city_id, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      activityData.name,
      activityData.description,
      activityData.category,
      activityData.price_range,
      activityData.rating || null,
      activityData.duration_hours || null,
      activityData.city_id,
      activityData.latitude || null,
      activityData.longitude || null
    ])
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function updateActivity(activityId: number, updateData: {
  name?: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  city_id?: number
  latitude?: number
  longitude?: number
}): Promise<any | null> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    })

    if (fields.length === 0) {
      return null
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(activityId)

    const query = `
      UPDATE activities 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function deleteActivity(activityId: number): Promise<boolean> {
  try {
    // Check if activity has associated bookings
    const checkResult = await pool.query(`
      SELECT COUNT(*) as booking_count
      FROM trip_activities 
      WHERE activity_id = $1
    `, [activityId])

    const { booking_count } = checkResult.rows[0]

    if (booking_count > 0) {
      throw new Error("Cannot delete activity: has associated bookings")
    }

    const result = await pool.query('DELETE FROM activities WHERE id = $1', [activityId])
    return (result.rowCount || 0) > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// User Management Functions
export async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<void> {
  await pool.query(
    'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, userId]
  )
}

export async function createUserActivityLog(
  userId: string, 
  action: string, 
  details: any,
  ipAddress?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO user_activity_logs (user_id, action, details, ip_address, timestamp)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
    [userId, action, JSON.stringify(details), ipAddress]
  )
}

export async function getUserActivityLogs(userId: string, limit: number = 50): Promise<any[]> {
  const result = await pool.query(
    `SELECT id, user_id, action, details, ip_address, timestamp
     FROM user_activity_logs
     WHERE user_id = $1
     ORDER BY timestamp DESC
     LIMIT $2`,
    [userId, limit]
  )
  
  return result.rows.map(row => ({
    ...row,
    details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details
  }))
}

export async function getUsersWithDetails(): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.created_at,
      u.updated_at,
      u.last_login,
      COUNT(t.id) as trip_count,
      COALESCE(SUM(t.budget), 0) as total_spent
    FROM users u
    LEFT JOIN trips t ON u.id = t.user_id
    GROUP BY u.id, u.name, u.email, u.role, u.status, u.created_at, u.updated_at, u.last_login
    ORDER BY u.created_at DESC
  `)
  
  return result.rows
}

export async function bulkUpdateUsers(
  userIds: string[], 
  action: string, 
  params: any
): Promise<void> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    switch (action) {
      case 'suspend':
      case 'activate':
      case 'ban':
        const status = action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned'
        await client.query(
          'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
          [status, userIds]
        )
        break
        
      case 'change_role':
        await client.query(
          'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2)',
          [params.new_role, userIds]
        )
        break
    }
    
    // Log bulk action for each user
    for (const userId of userIds) {
      await client.query(
        `INSERT INTO user_activity_logs (user_id, action, details, timestamp)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [userId, `bulk_${action}`, JSON.stringify(params)]
      )
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ============================================================================
// COMMUNITY FUNCTIONS
// ============================================================================

export interface CommunityPost {
  id: number
  display_id: number
  user_id: string
  title: string
  content: string
  post_type: 'experience' | 'review' | 'tip' | 'recommendation'
  trip_id?: number
  city_id?: number
  activity_id?: number
  images?: string[]
  tags?: string[]
  rating?: number
  likes_count: number
  comments_count: number
  views_count: number
  is_published: boolean
  is_featured: boolean
  is_verified: boolean
  created_at: Date
  updated_at: Date
  
  // Joined data
  user_name?: string
  user_email?: string
  user_profile_image?: string
  trip_name?: string
  city_name?: string
  city_country?: string
  activity_name?: string
  is_liked?: boolean
}

export interface CommunityPostFilters {
  search?: string
  post_type?: string
  city_id?: number
  activity_id?: number
  user_id?: string
  tags?: string[]
  rating?: number
  is_featured?: boolean
  sort_by?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' | 'highest_rated'
  limit?: number
  offset?: number
}

export async function createCommunityPost(postData: {
  user_id: string
  title: string
  content: string
  post_type: 'experience' | 'review' | 'tip' | 'recommendation'
  trip_id?: number
  city_id?: number
  activity_id?: number
  images?: string[]
  tags?: string[]
  rating?: number
}): Promise<CommunityPost> {
  try {
    const result = await pool.query(
      `INSERT INTO community_posts (
        user_id, title, content, post_type, trip_id, city_id, activity_id, 
        images, tags, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        postData.user_id,
        postData.title,
        postData.content,
        postData.post_type,
        postData.trip_id,
        postData.city_id,
        postData.activity_id,
        postData.images,
        postData.tags,
        postData.rating
      ]
    )
    return result.rows[0]
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getCommunityPosts(
  filters: CommunityPostFilters = {},
  currentUserId?: string
): Promise<CommunityPost[]> {
  try {
    let query = `
      SELECT 
        cp.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.profile_image as user_profile_image,
        t.name as trip_name,
        c.name as city_name,
        c.country as city_country,
        a.name as activity_name
        ${currentUserId ? `, EXISTS(
          SELECT 1 FROM community_post_likes cpl 
          WHERE cpl.post_id = cp.id AND cpl.user_id = $${currentUserId ? 'currentUserId' : 'null'}
        ) as is_liked` : ''}
      FROM community_posts cp
      LEFT JOIN users u ON cp.user_id = u.id
      LEFT JOIN trips t ON cp.trip_id = t.id
      LEFT JOIN cities c ON cp.city_id = c.id
      LEFT JOIN activities a ON cp.activity_id = a.id
      WHERE cp.is_published = true
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (currentUserId) {
      queryParams.push(currentUserId)
      query = query.replace('$currentUserId', `$${paramIndex}`)
      paramIndex++
    }

    if (filters.search) {
      query += ` AND (cp.title ILIKE $${paramIndex} OR cp.content ILIKE $${paramIndex} OR $${paramIndex} = ANY(cp.tags))`
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }

    if (filters.post_type) {
      query += ` AND cp.post_type = $${paramIndex}`
      queryParams.push(filters.post_type)
      paramIndex++
    }

    if (filters.city_id) {
      query += ` AND cp.city_id = $${paramIndex}`
      queryParams.push(filters.city_id)
      paramIndex++
    }

    if (filters.activity_id) {
      query += ` AND cp.activity_id = $${paramIndex}`
      queryParams.push(filters.activity_id)
      paramIndex++
    }

    if (filters.user_id) {
      query += ` AND cp.user_id = $${paramIndex}`
      queryParams.push(filters.user_id)
      paramIndex++
    }

    if (filters.rating) {
      query += ` AND cp.rating >= $${paramIndex}`
      queryParams.push(filters.rating)
      paramIndex++
    }

    if (filters.is_featured) {
      query += ` AND cp.is_featured = $${paramIndex}`
      queryParams.push(filters.is_featured)
      paramIndex++
    }

    // Sorting
    switch (filters.sort_by) {
      case 'oldest':
        query += ` ORDER BY cp.created_at ASC`
        break
      case 'most_liked':
        query += ` ORDER BY cp.likes_count DESC, cp.created_at DESC`
        break
      case 'most_commented':
        query += ` ORDER BY cp.comments_count DESC, cp.created_at DESC`
        break
      case 'highest_rated':
        query += ` ORDER BY cp.rating DESC NULLS LAST, cp.created_at DESC`
        break
      default: // newest
        query += ` ORDER BY cp.created_at DESC`
        break
    }

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`
      queryParams.push(filters.limit)
      paramIndex++
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`
      queryParams.push(filters.offset)
      paramIndex++
    }

    const result = await pool.query(query, queryParams)
    return result.rows
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function getCommunityPostById(
  postId: number, 
  currentUserId?: string
): Promise<CommunityPost | null> {
  try {
    // Increment view count
    await pool.query(
      'UPDATE community_posts SET views_count = views_count + 1 WHERE id = $1',
      [postId]
    )

    const query = `
      SELECT 
        cp.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.profile_image as user_profile_image,
        t.name as trip_name,
        c.name as city_name,
        c.country as city_country,
        a.name as activity_name
        ${currentUserId ? `, EXISTS(
          SELECT 1 FROM community_post_likes cpl 
          WHERE cpl.post_id = cp.id AND cpl.user_id = $2
        ) as is_liked` : ''}
      FROM community_posts cp
      LEFT JOIN users u ON cp.user_id = u.id
      LEFT JOIN trips t ON cp.trip_id = t.id
      LEFT JOIN cities c ON cp.city_id = c.id
      LEFT JOIN activities a ON cp.activity_id = a.id
      WHERE cp.id = $1 AND cp.is_published = true
    `

    const params = currentUserId ? [postId, currentUserId] : [postId]
    const result = await pool.query(query, params)
    return result.rows[0] || null
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function toggleCommunityPostLike(
  postId: number, 
  userId: string
): Promise<{ liked: boolean; newLikeCount: number }> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Check if already liked
    const existingLike = await client.query(
      'SELECT id FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    )

    let liked: boolean
    if (existingLike.rows.length > 0) {
      // Remove like
      await client.query(
        'DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      )
      await client.query(
        'UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = $1',
        [postId]
      )
      liked = false
    } else {
      // Add like
      await client.query(
        'INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      )
      await client.query(
        'UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      )
      liked = true
    }

    // Get new like count
    const result = await client.query(
      'SELECT likes_count FROM community_posts WHERE id = $1',
      [postId]
    )

    await client.query('COMMIT')
    return { liked, newLikeCount: result.rows[0].likes_count }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Database error:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function deleteCommunityPost(postId: number, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM community_posts WHERE id = $1 AND user_id = $2',
      [postId, userId]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

// ============================================================================
// COMMUNITY COMMENTS FUNCTIONS
// ============================================================================

export interface CommunityComment {
  id: number
  post_id: number
  user_id: string
  content: string
  parent_comment_id?: number
  likes_count: number
  is_deleted: boolean
  created_at: Date
  updated_at: Date
  
  // Joined data
  user_name?: string
  user_email?: string
  user_profile_image?: string
  is_liked?: boolean
  replies?: CommunityComment[]
}

export async function createCommunityComment(commentData: {
  post_id: number
  user_id: string
  content: string
  parent_comment_id?: number
}): Promise<CommunityComment> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Create the comment
    const result = await client.query(
      `INSERT INTO community_post_comments (
        post_id, user_id, content, parent_comment_id
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        commentData.post_id,
        commentData.user_id,
        commentData.content,
        commentData.parent_comment_id
      ]
    )

    // Update comment count on the post
    await client.query(
      'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [commentData.post_id]
    )

    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Database error:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function getCommunityComments(
  postId: number,
  currentUserId?: string
): Promise<CommunityComment[]> {
  try {
    const query = `
      SELECT 
        cc.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.profile_image as user_profile_image
        ${currentUserId ? `, EXISTS(
          SELECT 1 FROM community_comment_likes ccl 
          WHERE ccl.comment_id = cc.id AND ccl.user_id = $2
        ) as is_liked` : ''}
      FROM community_post_comments cc
      LEFT JOIN users u ON cc.user_id = u.id
      WHERE cc.post_id = $1 AND cc.is_deleted = false
      ORDER BY cc.created_at ASC
    `

    const params = currentUserId ? [postId, currentUserId] : [postId]
    const result = await pool.query(query, params)
    
    // Organize comments into threaded structure
    const comments = result.rows
    const topLevelComments: CommunityComment[] = []
    const commentMap = new Map<number, CommunityComment>()

    // First pass: create map and identify top-level comments
    comments.forEach(comment => {
      comment.replies = []
      commentMap.set(comment.id, comment)
      
      if (!comment.parent_comment_id) {
        topLevelComments.push(comment)
      }
    })

    // Second pass: organize replies
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies!.push(comment)
        }
      }
    })

    return topLevelComments
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export async function toggleCommunityCommentLike(
  commentId: number, 
  userId: string
): Promise<{ liked: boolean; newLikeCount: number }> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Check if already liked
    const existingLike = await client.query(
      'SELECT id FROM community_comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    )

    let liked: boolean
    if (existingLike.rows.length > 0) {
      // Remove like
      await client.query(
        'DELETE FROM community_comment_likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      )
      await client.query(
        'UPDATE community_post_comments SET likes_count = likes_count - 1 WHERE id = $1',
        [commentId]
      )
      liked = false
    } else {
      // Add like
      await client.query(
        'INSERT INTO community_comment_likes (comment_id, user_id) VALUES ($1, $2)',
        [commentId, userId]
      )
      await client.query(
        'UPDATE community_post_comments SET likes_count = likes_count + 1 WHERE id = $1',
        [commentId]
      )
      liked = true
    }

    // Get new like count
    const result = await client.query(
      'SELECT likes_count FROM community_post_comments WHERE id = $1',
      [commentId]
    )

    await client.query('COMMIT')
    return { liked, newLikeCount: result.rows[0].likes_count }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Database error:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function deleteCommunityComment(commentId: number, userId: string): Promise<boolean> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Get the comment to check post_id
    const commentResult = await client.query(
      'SELECT post_id FROM community_post_comments WHERE id = $1 AND user_id = $2',
      [commentId, userId]
    )

    if (commentResult.rows.length === 0) {
      return false
    }

    const postId = commentResult.rows[0].post_id

    // Delete the comment
    const deleteResult = await client.query(
      'DELETE FROM community_post_comments WHERE id = $1 AND user_id = $2',
      [commentId, userId]
    )

    if ((deleteResult.rowCount ?? 0) > 0) {
      // Update comment count on the post
      await client.query(
        'UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = $1',
        [postId]
      )
    }

    await client.query('COMMIT')
    return (deleteResult.rowCount ?? 0) > 0
  } catch (error) {
    await client.query('ROLLBACK')
    console.error("Database error:", error)
    throw error
  } finally {
    client.release()
  }
}
