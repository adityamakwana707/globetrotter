import { Pool } from "pg"
console.log("url",process.env.DATABASE_URL)
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
