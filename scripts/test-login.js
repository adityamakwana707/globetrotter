// Simple test for admin login
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nirmal@localhost:5432/globetrotter_db',
  ssl: false,
});

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login credentials...\n');
    
    const result = await pool.query("SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1", ['admin@globetrotter.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const user = result.rows[0];
    const testPassword = 'admin123';
    
    console.log('✅ Admin user exists:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password verification: SUCCESS');
      console.log('🚀 You can now login with:');
      console.log('   Email: admin@globetrotter.com');
      console.log('   Password: admin123');
      console.log('   URL: http://localhost:3000/auth/login');
    } else {
      console.log('❌ Password verification: FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAdminLogin();
