/*
  Create itinerary support tables in Postgres:
  - itinerary_days: day headers per trip
  - itinerary_entries: free-form items without catalog activity IDs
*/

// Best-effort load env from .env.local or .env
try {
  require('dotenv').config({ path: '.env.local' })
} catch (_) {}
try {
  require('dotenv').config()
} catch (_) {}

const { Pool } = require('pg')

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Please set it in your environment or .env/.env.local and rerun.')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

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
    `)

    await client.query(`
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

    await client.query('COMMIT')
    console.log('✅ Created/verified itinerary_days and itinerary_entries tables successfully.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Failed creating itinerary tables:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()


