const bcrypt = require('bcryptjs');

async function testPasswordHash() {
  try {
    console.log('🔍 Testing password hash generation...');
    
    const testPassword = 'admin123';
    
    // The hash from your sample data
    const storedHash = '$2a$12$LQv3c1yqBw1uK6dQ.vzGhOg8QSs6s5KFLnD5mw.sOj6yMrTX8IcKu';
    
    console.log('Testing password:', testPassword);
    console.log('Stored hash:', storedHash);
    
    // Test verification
    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('Password verification result:', isValid);
    
    if (!isValid) {
      console.log('❌ Password verification failed');
      console.log('Generating new hash for comparison...');
      
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('New hash:', newHash);
      
      // Test the new hash
      const newIsValid = await bcrypt.compare(testPassword, newHash);
      console.log('New hash verification:', newIsValid);
    } else {
      console.log('✅ Password verification successful');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPasswordHash();
