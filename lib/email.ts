// Email service for sending notifications
// Uses Gmail SMTP for production email delivery

import nodemailer from 'nodemailer'

// Create reusable transporter
export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify connection
emailTransporter.verify(function (error, success) {
  if (error) {
    console.error('Email configuration error:', error)
  } else {
    console.log('Server is ready to send emails')
  }
})

interface EmailConfig {
  from: string
  to: string
  subject: string
  html: string
}

// Email service with fallback to mock for development
export async function sendEmail(config: EmailConfig): Promise<void> {
  // If Gmail SMTP is configured, use it
  if (emailTransporter) {
    try {
      const result = await emailTransporter.sendMail({
        from: config.from,
        to: config.to,
        subject: config.subject,
        html: config.html,
      })
      
      console.log(`📧 Email sent successfully to ${config.to}`)
      console.log(`📧 Message ID: ${result.messageId}`)
      
    } catch (error) {
      console.error('❌ Gmail SMTP email failed:', error)
      // Fallback to mock service
      await sendMockEmail(config)
    }
  } else {
    // Use mock service for development
    console.log('📧 No SMTP configured - using mock service')
    await sendMockEmail(config)
  }
}

// Mock email service for development
async function sendMockEmail(config: EmailConfig): Promise<void> {
  console.log("📧 Mock Email Service (Development)")
  console.log("📧 From:", config.from)
  console.log("📧 To:", config.to)
  console.log("📧 Subject:", config.subject)
  console.log("📧 HTML:", config.html)
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000))
}

export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string, 
  firstName?: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  const name = firstName || "User"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password - GlobeTrotter</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #1E40AF;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #1E40AF;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #10B981;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">GT</div>
        <h1>GlobeTrotter</h1>
      </div>
      
      <div class="content">
        <h2>Reset Your Password</h2>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your GlobeTrotter account. If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong><br>
          • This link will expire in 1 hour for security reasons<br>
          • If you didn't request this password reset, please ignore this email<br>
          • Your password won't be changed unless you click the link above
        </div>
        
        <p>If you continue to have problems, please contact our support team.</p>
        
        <p>Best regards,<br>The GlobeTrotter Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${email}. If you received this by mistake, please ignore it.</p>
        <p>&copy; ${new Date().getFullYear()} GlobeTrotter. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    from: "GlobeTrotter <noreply@globetrotter.com>",
    to: email,
    subject: "Reset Your Password - GlobeTrotter",
    html
  })
}

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
  const name = firstName || "User"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to GlobeTrotter!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #1E40AF;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #1E40AF;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #10B981;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">GT</div>
        <h1>Welcome to GlobeTrotter!</h1>
      </div>
      
      <div class="content">
        <h2>Your adventure begins now! 🌍</h2>
        
        <p>Hello ${name},</p>
        
        <p>Welcome to GlobeTrotter! We're excited to help you plan amazing trips and create unforgettable memories.</p>
        
        <p>Here's what you can do with your new account:</p>
        <ul>
          <li>✈️ Plan detailed trip itineraries</li>
          <li>🏨 Manage accommodations and activities</li>
          <li>💰 Track your travel budget</li>
          <li>📱 Access your trips on any device</li>
          <li>🤝 Share trips with friends and family</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Start Planning Your Trip</a>
        </div>
        
        <p>If you have any questions, our support team is here to help!</p>
        
        <p>Happy travels,<br>The GlobeTrotter Team</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} GlobeTrotter. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    from: "GlobeTrotter <noreply@globetrotter.com>",
    to: email,
    subject: "Welcome to GlobeTrotter! 🌍",
    html
  })
}

export async function sendEmailVerificationOTP(
  email: string, 
  otpCode: string, 
  firstName?: string
): Promise<void> {
  const name = firstName || "User"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Your Email - GlobeTrotter</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #1E40AF;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #1E40AF;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 30px 0;
        }
        .otp-container {
          text-align: center;
          background: #f8fafc;
          border: 2px solid #1E40AF;
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 48px;
          font-weight: bold;
          color: #1E40AF;
          letter-spacing: 8px;
          font-family: monospace;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #10B981;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          padding: 20px 0;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">GT</div>
        <h1>GlobeTrotter</h1>
      </div>
      
      <div class="content">
        <h2>Verify Your Email Address</h2>
        
        <p>Hello ${name},</p>
        
        <p>Welcome to GlobeTrotter! To complete your registration and start planning amazing trips, please verify your email address using the verification code below:</p>
        
        <div class="otp-container">
          <h3>Your Verification Code</h3>
          <div class="otp-code">${otpCode}</div>
          <p>Enter this code in the verification form to complete your registration.</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong><br>
          • This code will expire in 10 minutes for security reasons<br>
          • If you didn't create a GlobeTrotter account, please ignore this email<br>
          • Never share this verification code with anyone
        </div>
        
        <p>Once verified, you'll have access to all GlobeTrotter features:</p>
        <ul>
          <li>✈️ Plan detailed trip itineraries</li>
          <li>🏨 Manage accommodations and activities</li>
          <li>💰 Track your travel budget</li>
          <li>📱 Access your trips on any device</li>
          <li>🤝 Share trips with friends and family</li>
        </ul>
        
        <p>If you have any questions, our support team is here to help!</p>
        
        <p>Happy travels,<br>The GlobeTrotter Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${email}. If you received this by mistake, please ignore it.</p>
        <p>&copy; ${new Date().getFullYear()} GlobeTrotter. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    from: "GlobeTrotter <noreply@globetrotter.com>",
    to: email,
    subject: "Verify Your Email - GlobeTrotter",
    html
  })
}
