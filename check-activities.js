const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkActivities() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM activities');
    console.log('Activities count:', result.rows[0].count);
    
    if (result.rows[0].count > 0) {
      const activities = await pool.query('SELECT * FROM activities LIMIT 3');
      console.log('Sample activities:', activities.rows);
    }
    
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'activities' 
      ORDER BY ordinal_position
    `);
    console.log('Activities table columns:', columns.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkActivities();
