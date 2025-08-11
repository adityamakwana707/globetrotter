# Password Reset Feature Documentation

## Overview
The GlobeTrotter application now includes a complete password reset functionality that allows users to securely reset their passwords via email verification.

## Features Implemented

### 1. Forgot Password Page (`/auth/forgot-password`)
- Clean, user-friendly interface
- Email validation
- Success/error state handling
- Loading states during API calls

### 2. Reset Password Page (`/auth/reset-password`)
- Token verification
- Password strength validation
- Confirm password matching
- Success redirect to login

### 3. API Routes
- `POST /api/auth/forgot-password` - Generates reset token and sends email
- `POST /api/auth/verify-reset-token` - Validates reset token
- `POST /api/auth/reset-password` - Updates password with token

### 4. Database Integration
- `password_resets` table for secure token management
- Automatic token expiration (1 hour)
- Single-use token validation
- Proper cleanup of expired tokens

### 5. Email Service
- Beautiful HTML email templates
- Password reset instructions
- Security warnings and best practices
- Professional branding

## Security Features

### Token Security
- UUID-based tokens for cryptographic security
- 1-hour expiration window
- Single-use validation (tokens are marked as used)
- Automatic cleanup of expired tokens

### Email Security
- No user existence disclosure (same response regardless)
- Rate limiting considerations built-in
- Professional email templates with security warnings

### Database Security
- Foreign key constraints
- Proper indexing for performance
- Transaction rollback on errors
- Secure password hashing with bcryptjs

## Setup Instructions

### 1. Database Migration
Run the password reset table migration:
```sql
-- Connect to your PostgreSQL database and run:
\i scripts/add-password-resets.sql
```

### 2. Environment Variables
Add to your `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
```

### 3. Email Service Configuration
The current implementation uses a mock email service for development. For production:

1. **SendGrid Integration:**
```typescript
// Replace the mock sendEmail function in lib/email.ts
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendEmail(config: EmailConfig): Promise<void> {
  await sgMail.send({
    from: config.from,
    to: config.to,
    subject: config.subject,
    html: config.html
  })
}
```

2. **Nodemailer Integration:**
```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  // Your SMTP configuration
})

export async function sendEmail(config: EmailConfig): Promise<void> {
  await transporter.sendMail(config)
}
```

## Usage Flow

### For Users:
1. Go to login page
2. Click "Forgot your password?"
3. Enter email address
4. Check email for reset link
5. Click reset link in email
6. Enter new password
7. Login with new password

### For Developers:
1. Monitor email service logs
2. Check database for token cleanup
3. Handle API rate limiting
4. Monitor failed reset attempts

## Database Schema

```sql
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Reference

### POST /api/auth/forgot-password
Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "message": "If an account with that email exists, we've sent a password reset link."
}
```

### POST /api/auth/verify-reset-token
Request:
```json
{
  "token": "uuid-token-here"
}
```

Response:
```json
{
  "message": "Token is valid"
}
```

### POST /api/auth/reset-password
Request:
```json
{
  "token": "uuid-token-here",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

Response:
```json
{
  "message": "Password has been reset successfully"
}
```

## Error Handling

### Common Errors:
- Invalid email format (400)
- Token expired (400)
- Token already used (400)
- Password validation failed (400)
- Email service failures (graceful degradation)
- Database connection issues (500)

### Security Considerations:
- No user enumeration (same response for valid/invalid emails)
- Rate limiting recommended for production
- HTTPS required for production
- Email service reliability monitoring

## Testing

### Manual Testing:
1. Test forgot password flow with valid email
2. Test with invalid email (should still show success)
3. Test token expiration
4. Test token reuse prevention
5. Test password validation
6. Test email template rendering

### Development Email Testing:
In development, check the console logs for the mock email content:
```
📧 Mock Email Service
📧 From: GlobeTrotter <noreply@globetrotter.com>
📧 To: user@example.com
📧 Subject: Reset Your Password - GlobeTrotter
📧 HTML: [email content]
```

## Production Deployment Checklist

- [ ] Set up production email service (SendGrid/Mailgun/AWS SES)
- [ ] Configure NEXTAUTH_URL environment variable
- [ ] Set up database password_resets table
- [ ] Configure email service API keys
- [ ] Test email delivery in production
- [ ] Set up email service monitoring
- [ ] Configure rate limiting
- [ ] Enable HTTPS
- [ ] Test complete flow end-to-end
- [ ] Set up error monitoring
- [ ] Configure email templates with production branding

## Future Enhancements

### Potential Improvements:
1. **Email Templates**: Multiple language support
2. **Security**: Additional rate limiting and CAPTCHA
3. **Analytics**: Track password reset usage
4. **User Experience**: SMS-based reset option
5. **Admin**: Password reset management dashboard
6. **Security**: Suspicious activity detection
7. **Compliance**: GDPR data handling for reset tokens

### Advanced Features:
- Two-factor authentication integration
- Password policy enforcement
- Account lockout after failed attempts
- Security audit logging
- Email verification during password reset
