# Email Service Setup Guide

This guide will help you set up Gmail SMTP to send OTP verification codes.

## Gmail SMTP Setup (Recommended)

### 1. Enable 2-Factor Authentication
- Go to your [Google Account settings](https://myaccount.google.com/)
- Navigate to Security → 2-Step Verification
- Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
- Go to Security → App passwords
- Select "Mail" as the app
- Select "Other" as the device (name it "GlobeTrotter")
- Click "Generate"
- Copy the 16-character password (it will look like: xxxx xxxx xxxx xxxx)

### 3. Add to Environment
Create or update your `.env.local` file:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

**Important**: Use the app password, NOT your regular Gmail password!

### 4. Test Configuration
```bash
node scripts/test-email.js
```

## Alternative: Mailgun

### 1. Create Mailgun Account
- Go to [Mailgun.com](https://mailgun.com)
- Sign up for a free account (5,000 emails/month free)

### 2. Get API Key
- Go to Settings → API Keys
- Copy your Private API Key

### 3. Add to Environment
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
```

## Environment Variables Summary

### Required for Gmail SMTP
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Required for Mailgun
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
```

### Always Required
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

## Testing the Email Service

### 1. Test Configuration
```bash
node scripts/test-email.js
```

### 2. Test OTP Sending
1. Set up environment variables
2. Register a new user
3. Check console logs for email details
4. Verify OTP email is sent

## Troubleshooting

### Gmail SMTP Issues
- **"Invalid credentials"**: Use app password, not regular password
- **"Less secure app access"**: Enable 2FA and use app password
- **"Username and Password not accepted"**: Check app password format

### General Issues
- **Emails not sending**: Check environment variables are loaded
- **Console errors**: Check credentials format
- **Rate limiting**: Gmail allows 500 emails/day for regular accounts

## Production Considerations

### 1. Email Deliverability
- Gmail has good deliverability for personal accounts
- Consider using a business Gmail account for production
- Monitor bounce rates and spam reports

### 2. Rate Limiting
- Gmail: 500 emails/day for regular accounts
- Gmail Business: 2,000 emails/day
- Monitor usage to avoid hitting limits

### 3. Security
- Never commit app passwords to version control
- Use environment variables for all sensitive data
- Regularly rotate app passwords

## Quick Start (Gmail SMTP)

1. **Enable 2FA** on your Google account
2. **Generate app password** for "Mail"
3. **Add to .env.local**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```
4. **Test**: `node scripts/test-email.js`
5. **Verify**: Register a new user to test OTP emails

## Current Implementation

The system currently uses a placeholder Gmail SMTP service that logs emails to console. To implement actual SMTP sending:

1. **Install nodemailer**: `npm install nodemailer`
2. **Update the email service** in `lib/email.ts`
3. **Replace the placeholder** with actual SMTP code
4. **Test with real emails**

For now, the mock service will work for development and testing purposes.
