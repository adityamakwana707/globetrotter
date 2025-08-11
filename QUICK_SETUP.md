# Quick Setup Guide for GlobeTrotter

## 🚀 Quick Start for Hackathon Demo

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/globetrotter"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps API (for location search and maps)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Weather API (OpenWeatherMap)
NEXT_PUBLIC_WEATHER_API_KEY="your-openweather-api-key"

# Optional
NODE_ENV="development"
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb globetrotter`
3. Run schema: `psql -d globetrotter -f scripts/database-schema.sql`
4. Add sample data: `psql -d globetrotter -f scripts/sample-data.sql`

#### Option B: Quick Docker Setup
```bash
# Start PostgreSQL with Docker
docker run --name globetrotter-db -e POSTGRES_DB=globetrotter -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Wait a few seconds, then run schema
psql -h localhost -U postgres -d globetrotter -f scripts/database-schema.sql

# Add sample data
psql -h localhost -U postgres -d globetrotter -f scripts/sample-data.sql
```

#### Option C: Online Database (Fastest for Demo)
Use a free service like:
- Neon.tech (recommended)
- Supabase
- Railway
- ElephantSQL

### 3. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 4. Test Database Connection
```bash
npm run dev
```
Then visit: `http://localhost:3000/api/test-db`

### 5. Start Development
```bash
npm run dev
```

## 🎯 Demo Flow

1. **Register/Login**: Create an account at `/auth/register`
2. **Dashboard**: View the main dashboard with stats
3. **Create Trip**: Click "New Trip" to create a trip
4. **Add Itinerary**: Add cities and activities to your trip
5. **Upload Images**: Upload cover images for trips
6. **Manage Trips**: Edit, duplicate, or delete trips

## 🔧 Troubleshooting

### Common Issues:

1. **400 Error on Trip Creation**:
   - Check console logs for validation errors
   - Ensure all required fields are filled
   - Verify date format (YYYY-MM-DD)

2. **Database Connection Issues**:
   - Verify DATABASE_URL in .env.local
   - Check if PostgreSQL is running
   - Test connection at `/api/test-db`

3. **Authentication Issues**:
   - Set NEXTAUTH_SECRET (use: `openssl rand -base64 32`)
   - Clear browser cookies/localStorage
   - Check NEXTAUTH_URL matches your domain

4. **Build Issues**:
   - Use `--legacy-peer-deps` flag
   - Clear `.next` folder: `rm -rf .next`
   - Restart dev server

## 📱 Features Ready for Demo

✅ **User Authentication** (Register/Login/Logout)
✅ **Trip Management** (Create/Edit/Delete/Duplicate)
✅ **Image Upload** (Trip cover images)
✅ **Itinerary Builder** (Add cities and activities)
✅ **Dashboard** (Trip statistics and overview)
✅ **Responsive Design** (Mobile-friendly)
✅ **Security** (Rate limiting, validation, CSRF protection)

## 🎨 UI Highlights

- **Dark Theme** with professional styling
- **Responsive Design** works on all devices
- **Loading States** and smooth animations
- **Toast Notifications** for user feedback
- **Error Handling** with user-friendly messages
- **Form Validation** with helpful error messages

Your GlobeTrotter app is hackathon-ready! 🏆
