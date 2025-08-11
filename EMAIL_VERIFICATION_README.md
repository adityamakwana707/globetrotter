# Email Verification OTP System

This document describes the email verification OTP (One-Time Password) system implemented in GlobeTrotter.

## Overview

The email verification system ensures that users verify their email addresses before accessing the platform. It uses 6-digit OTP codes sent via email with a 10-minute expiration time.

## Features

- ✅ **6-digit OTP codes** - Secure random generation
- ✅ **10-minute expiration** - Automatic cleanup of expired codes
- ✅ **Rate limiting** - Prevents abuse of OTP sending
- ✅ **Beautiful email templates** - Professional-looking verification emails
- ✅ **Resend functionality** - Users can request new codes
- ✅ **Automatic cleanup** - Expired OTPs are automatically removed

## Database Schema

### New Table: `email_verification_otps`

```sql
CREATE TABLE email_verification_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, email)
);
```

### Updated Users Table

The `users` table now includes:
- `email_verified` - Boolean flag indicating verification status

## API Endpoints

### 1. Send OTP (`POST /api/auth/send-otp`)

Sends a new OTP code to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

**Rate Limiting:** Uses the same rate limiting as password reset (prevents abuse)

### 2. Verify OTP (`POST /api/auth/verify-otp`)

Verifies the OTP code and marks the user's email as verified.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "email": "user@example.com"
}
```

### 3. Registration (`POST /api/auth/register`)

Updated to automatically send OTP after user creation.

**Response:**
```json
{
  "message": "User created successfully. Please check your email for verification code.",
  "user": { ... },
  "requiresVerification": true
}
```

## User Flow

### 1. Registration
1. User fills out registration form
2. Account is created with `email_verified = false`
3. OTP is automatically sent to user's email
4. User is redirected to verification page

### 2. Email Verification
1. User receives email with 6-digit OTP
2. User enters OTP on verification page
3. System verifies OTP and marks email as verified
4. User is redirected to login page

### 3. Login
1. User can now log in normally
2. System checks `email_verified` status
3. Verified users have full access

## Email Templates

### Verification Email Features
- **Professional design** with GlobeTrotter branding
- **Large, clear OTP display** (48px font, monospace)
- **Security warnings** about code expiration and sharing
- **Feature highlights** to encourage verification
- **Responsive design** for mobile devices

## Security Features

### OTP Generation
- **6-digit random codes** (100,000 - 999,999)
- **Cryptographically secure** random number generation
- **Unique per user/email** combination

### Rate Limiting
- **Prevents OTP spam** using existing rate limiting system
- **IP-based tracking** to prevent abuse
- **Configurable limits** for production environments

### Expiration
- **10-minute expiration** for security
- **Automatic cleanup** of expired codes
- **Single-use codes** (marked as used after verification)

## Database Functions

### Core Functions

```typescript
// Generate and store OTP
createEmailVerificationOTP(userId: string, email: string): Promise<string>

// Verify OTP and mark email as verified
verifyEmailVerificationOTP(userId: string, email: string, otpCode: string): Promise<boolean>

// Clean up expired OTPs
cleanupExpiredEmailVerificationOTPs(): Promise<void>
```

### Automatic Cleanup

The system automatically cleans up expired OTPs through:
- **API endpoint**: `/api/auth/cleanup-expired-tokens`
- **Cron job support** for production environments
- **Database maintenance** to prevent table bloat

## Frontend Components

### Verification Page (`/auth/verify-email`)
- **OTP input** using the `input-otp` component
- **Real-time validation** of 6-digit codes
- **Resend functionality** for new codes
- **Success/error messaging** with proper styling
- **Responsive design** for all devices

### OTP Input Component
- **6-digit input** with individual slots
- **Auto-focus** and navigation between slots
- **Visual feedback** for active/inactive states
- **Accessibility** features for screen readers

## Setup Instructions

### 1. Database Setup

Run the SQL script to add OTP functionality:

```bash
# For new installations
psql -d your_database -f scripts/enhanced-database-schema.sql

# For existing installations
psql -d your_database -f scripts/add-email-verification-otps.sql
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
# Email service configuration
NEXTAUTH_URL=http://localhost:3000

# Database connection
DATABASE_URL=postgresql://...

# Optional: Cleanup endpoint security
CLEANUP_SECRET_KEY=your-secret-key
```

### 3. Email Service

The system includes a mock email service for development. For production:

1. **Replace mock service** in `lib/email.ts`
2. **Configure SMTP** or email service provider
3. **Set up proper authentication** and security
4. **Test email delivery** before going live

## Testing

### Manual Testing
1. **Register new user** - should receive OTP email
2. **Verify OTP** - should mark email as verified
3. **Login** - should work after verification
4. **Resend OTP** - should send new code
5. **Expired OTP** - should reject after 10 minutes

### Automated Testing
- **API endpoints** - test all success/error cases
- **Database functions** - verify OTP creation/verification
- **Email templates** - check rendering and content
- **Rate limiting** - verify abuse prevention

## Production Considerations

### Email Service
- **Use reliable provider** (SendGrid, Mailgun, AWS SES)
- **Set up SPF/DKIM** for email deliverability
- **Monitor bounce rates** and handle failures
- **Implement retry logic** for failed sends

### Security
- **HTTPS only** for all OTP endpoints
- **Rate limiting** to prevent abuse
- **Logging** for security monitoring
- **Regular cleanup** of expired codes

### Performance
- **Database indexes** for OTP queries
- **Connection pooling** for database operations
- **Async email sending** to prevent blocking
- **Monitoring** of OTP generation/verification times

## Troubleshooting

### Common Issues

1. **OTP not received**
   - Check email service configuration
   - Verify rate limiting settings
   - Check spam/junk folders

2. **OTP verification fails**
   - Verify OTP hasn't expired (10 minutes)
   - Check database connection
   - Verify user exists and email matches

3. **Database errors**
   - Run database setup scripts
   - Check table permissions
   - Verify foreign key constraints

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_OTP=true
```

This will log OTP generation, verification, and cleanup operations.

## Future Enhancements

### Planned Features
- **SMS OTP** as alternative to email
- **Backup codes** for account recovery
- **Two-factor authentication** integration
- **Advanced rate limiting** with user-based limits
- **OTP analytics** and usage tracking

### Integration Points
- **Admin dashboard** - OTP usage statistics
- **User profile** - verification status display
- **Security settings** - re-verification options
- **Audit logging** - verification history

## Support

For issues or questions about the email verification system:

1. **Check logs** for error messages
2. **Verify database** schema and data
3. **Test email service** configuration
4. **Review rate limiting** settings
5. **Check environment** variables

The system is designed to be robust and secure while providing a smooth user experience for email verification.
