// Test script for real email service
// Run with: node scripts/test-real-email.js

require('dotenv').config({ path: '.env.local' })

async function testRealEmailService() {
  try {
    console.log('🧪 Testing Real Email Service...')
    
    // Check environment variables
    console.log('📧 Environment Check:')
    console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured')
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured')
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n❌ Gmail SMTP not configured!')
      console.log('📝 To set up Gmail SMTP:')
      console.log('   1. Enable 2-Factor Authentication on your Google account')
      console.log('   2. Generate an App Password for "Mail"')
      console.log('   3. Add to .env.local:')
      console.log('      SMTP_USER=your-email@gmail.com')
      console.log('      SMTP_PASS=your-16-char-app-password')
      return
    }
    
    console.log('\n📧 Gmail SMTP is configured!')
    console.log('📧 Email will be sent from:', process.env.SMTP_USER)
    
    // Test the email service
    const { sendEmail } = require('../lib/email')
    
    console.log('\n📧 Sending test email...')
    await sendEmail({
      from: 'GlobeTrotter <noreply@globetrotter.com>',
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Test Email - GlobeTrotter OTP System',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the Gmail SMTP is working.</p>
        <p>If you receive this, your email service is configured correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    })
    
    console.log('\n✅ Test email sent! Check your inbox.')
    
  } catch (error) {
    console.error('❌ Email service test failed:', error)
  }
}

testRealEmailService()
