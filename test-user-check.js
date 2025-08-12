const { Pool } = require('pg');

// Create a pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function checkUser(email) {
  try {
    console.log(`🔍 Checking for user with email: ${email}`);
    
    // Check users table
    const usersResult = await pool.query(
      'SELECT id, email, first_name, last_name, email_verified, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (usersResult.rows.length > 0) {
      console.log('✅ Found in users table:');
      usersResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Verified: ${user.email_verified}, Created: ${user.created_at}`);
      });
    } else {
      console.log('❌ Not found in users table');
    }
    
    // Check unverified_users table
    const unverifiedResult = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM unverified_users WHERE email = $1',
      [email]
    );
    
    if (unverifiedResult.rows.length > 0) {
      console.log('✅ Found in unverified_users table:');
      unverifiedResult.rows.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Created: ${user.created_at}`);
      });
    } else {
      console.log('❌ Not found in unverified_users table');
    }
    
    // Check email_verification_otps table
    const otpResult = await pool.query(
      'SELECT user_id, email, otp_code, expires_at, used_at FROM email_verification_otps WHERE email = $1',
      [email]
    );
    
    if (otpResult.rows.length > 0) {
      console.log('✅ Found in email_verification_otps table:');
      otpResult.rows.forEach(otp => {
        console.log(`  - User ID: ${otp.user_id}, OTP: ${otp.otp_code}, Expires: ${otp.expires_at}, Used: ${otp.used_at}`);
      });
    } else {
      console.log('❌ Not found in email_verification_otps table');
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await pool.end();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node test-user-check.js <email>');
  console.log('Example: node test-user-check.js test@example.com');
  process.exit(1);
}

checkUser(email);
