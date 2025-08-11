const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nirmal@localhost:5432/globetrotter_db',
  ssl: false,
});

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication...');
    
    // First, get the user from database
    const result = await pool.query("SELECT id, email, password, first_name, last_name, role FROM users WHERE email = $1", ['admin@globetrotter.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.first_name, user.last_name);
    console.log('Role:', user.role);
    console.log('Password hash length:', user.password.length);
    console.log('Password hash:', user.password);
    
    // Test password
    const testPassword = 'admin123';
    console.log('\n🔑 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n🔧 Creating new hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('New hash:', newHash);
      console.log('New hash length:', newHash.length);
      
      // Update the database
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [newHash, 'admin@globetrotter.com']);
      console.log('✅ Password updated in database');
      
      // Verify the update
      const verifyResult = await pool.query("SELECT password FROM users WHERE email = $1", ['admin@globetrotter.com']);
      const updatedHash = verifyResult.rows[0].password;
      console.log('Updated hash from DB:', updatedHash);
      
      const finalTest = await bcrypt.compare(testPassword, updatedHash);
      console.log('Final test result:', finalTest);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugAuth();
