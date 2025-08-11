// Test script for email service configuration
// Run with: node scripts/test-email.js

require('dotenv').config({ path: '.env.local' })

async function testEmailService() {
  try {
    console.log('🧪 Testing Email Service Configuration...')
    
    // Check environment variables
    console.log('📧 Environment Check:')
    console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured')
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured')
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('📧 Gmail SMTP is configured and will be used for emails')
      console.log('📧 Email will be sent from:', process.env.SMTP_USER)
    } else {
      console.log('📧 No email service configured - using mock service')
      console.log('📧 Emails will be logged to console only')
    }
    
    console.log('\n✅ Email service configuration test completed!')
    console.log('\n📝 To set up Gmail SMTP:')
    console.log('   1. Enable 2-Factor Authentication on your Google account')
    console.log('   2. Generate an App Password for "Mail"')
    console.log('   3. Add to .env.local:')
    console.log('      SMTP_USER=your-email@gmail.com')
    console.log('      SMTP_PASS=your-16-char-app-password')
    console.log('   4. Register a new user to test OTP email sending')
    
  } catch (error) {
    console.error('❌ Email service test failed:', error)
  }
}

testEmailService()
