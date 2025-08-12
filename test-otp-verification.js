const { Pool } = require('pg');

// Create a pool connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function testOTPVerification() {
  try {
    console.log('🔍 Testing OTP verification process...');
    
    // Step 1: Check current state of users and unverified_users tables
    console.log('\n📊 Current database state:');
    
    const usersResult = await pool.query(
      'SELECT id, email, first_name, last_name, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('Users table:');
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`  - ${user.email}: ${user.first_name} ${user.last_name}, Verified: ${user.email_verified}, Created: ${user.created_at}`);
      });
    } else {
      console.log('  No users found');
    }
    
    const unverifiedResult = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM unverified_users ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\nUnverified users table:');
    if (unverifiedResult.rows.length > 0) {
      unverifiedResult.rows.forEach(user => {
        console.log(`  - ${user.email}: ${user.first_name} ${user.last_name}, Created: ${user.created_at}`);
      });
    } else {
      console.log('  No unverified users found');
    }
    
    // Step 2: Check OTP table
    const otpResult = await pool.query(
      'SELECT user_id, email, otp_code, expires_at, used_at FROM email_verification_otps ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\nEmail verification OTPs:');
    if (otpResult.rows.length > 0) {
      otpResult.rows.forEach(otp => {
        console.log(`  - User ID: ${otp.user_id}, Email: ${otp.email}, OTP: ${otp.otp_code}, Expires: ${otp.expires_at}, Used: ${otp.used_at}`);
      });
    } else {
      console.log('  No OTPs found');
    }
    
    // Step 3: Check foreign key constraints
    console.log('\n🔗 Foreign key constraints:');
    const constraintResult = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'email_verification_otps' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    if (constraintResult.rows.length > 0) {
      constraintResult.rows.forEach(constraint => {
        console.log(`  - ${constraint.constraint_name}: ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });
    } else {
      console.log('  No foreign key constraints found');
    }
    
    // Step 4: Check if email_verified column exists in users table
    console.log('\n📋 Table structure check:');
    const columnResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);
    
    if (columnResult.rows.length > 0) {
      const column = columnResult.rows[0];
      console.log(`  email_verified column: ${column.data_type}, Nullable: ${column.is_nullable}, Default: ${column.column_default}`);
    } else {
      console.log('  ❌ email_verified column NOT found in users table!');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await pool.end();
  }
}

testOTPVerification();
