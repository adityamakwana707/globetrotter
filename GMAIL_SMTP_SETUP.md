# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP to send real OTP verification emails.

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account settings](https://myaccount.google.com/)
2. Click **Security** → **2-Step Verification**
3. Click **Get Started** and follow the prompts
4. **Important**: You must complete 2FA setup before proceeding

### Step 2: Generate App Password
1. Go to **Security** → **App passwords**
2. Select **Mail** as the app
3. Select **Other** as the device
4. Name it **"GlobeTrotter"**
5. Click **Generate**
6. **Copy the 16-character password** (looks like: `xxxx xxxx xxxx xxxx`)

### Step 3: Add to Environment
1. Create or edit `.env.local` file in your project root
2. Add these lines:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```
3. **Save the file**

### Step 4: Test the Setup
```bash
node scripts/test-real-email.js
```

## 🔧 Detailed Setup

### Why App Passwords?
- **Regular Gmail password won't work** with SMTP
- **App passwords are secure** and can be revoked
- **Required for 2FA accounts** to use SMTP

### Environment Variables Explained
```env
SMTP_USER=manaspublic321@gmail.com          # Your Gmail address
SMTP_PASS=abcd efgh ijkl mnop              # 16-char app password
```

### File Structure
```
globetrotter/
├── .env.local                    # Add your credentials here
├── lib/email.ts                  # Email service (already updated)
└── scripts/test-real-email.js   # Test script
```

## 🧪 Testing

### Test 1: Configuration Check
```bash
node scripts/test-real-email.js
```
Expected output:
```
📧 Gmail SMTP is configured!
📧 Email will be sent from: your-email@gmail.com
📧 Sending test email...
✅ Test email sent! Check your inbox.
```

### Test 2: OTP Email
1. Register a new user
2. Check console for: `✅ Gmail SMTP connection established`
3. Check your email for OTP verification code

## ❌ Troubleshooting

### "Invalid credentials" Error
- **Use app password**, not regular password
- **Ensure 2FA is enabled** on your Google account
- **Check password format** (16 characters, no spaces)

### "Less secure app access" Error
- **Enable 2-Factor Authentication** first
- **Generate app password** for "Mail"
- **Use app password** in SMTP_PASS

### "Connection failed" Error
- **Check internet connection**
- **Verify Gmail credentials**
- **Ensure .env.local is loaded**

### "Rate limit exceeded" Error
- **Gmail limit**: 500 emails/day for regular accounts
- **Wait 24 hours** or upgrade to Gmail Business

## 🔒 Security Best Practices

### Environment Variables
- **Never commit** `.env.local` to version control
- **Use strong app passwords**
- **Rotate passwords** regularly

### Gmail Settings
- **Keep 2FA enabled**
- **Monitor app passwords** in Google Account
- **Revoke unused** app passwords

## 📱 Production Considerations

### Email Limits
- **Personal Gmail**: 500 emails/day
- **Gmail Business**: 2,000 emails/day
- **Monitor usage** to avoid hitting limits

### Deliverability
- **Gmail has excellent** deliverability
- **Avoid spam triggers** (proper HTML, clear subject)
- **Monitor bounce rates**

### Backup Plan
- **Mock service** falls back automatically
- **Logs all email attempts** for debugging
- **Graceful degradation** if SMTP fails

## 🎯 Next Steps

1. **Complete the setup** using the steps above
2. **Test with real email** using the test script
3. **Register a new user** to test OTP emails
4. **Verify OTP codes** in your email inbox

## 🆘 Need Help?

If you encounter issues:

1. **Check console logs** for specific error messages
2. **Verify 2FA is enabled** on your Google account
3. **Ensure app password** is 16 characters
4. **Check .env.local** file is in project root
5. **Restart your app** after adding environment variables

Your OTP system will automatically use Gmail SMTP once configured, or fall back to the mock service for development.
