# Database Setup Guide

## Quick Setup Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL:**
   - Download from https://www.postgresql.org/download/
   - Install with default settings
   - Remember your postgres user password

2. **Create Database:**
   ```sql
   -- Connect to PostgreSQL as postgres user
   psql -U postgres
   
   -- Create database
   CREATE DATABASE globetrotter;
   
   -- Create user (optional, can use postgres user)
   CREATE USER globetrotter_user WITH PASSWORD 'secure_password_123';
   GRANT ALL PRIVILEGES ON DATABASE globetrotter TO globetrotter_user;
   
   -- Connect to the new database
   \c globetrotter;
   ```

3. **Run Schema:**
   ```bash
   # From your project directory
   psql -U postgres -d globetrotter -f scripts/database-schema.sql
   psql -U postgres -d globetrotter -f scripts/sample-data.sql
   ```

4. **Update .env.local:**
   ```env
   # Using postgres user
   DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/globetrotter"
   
   # Or using custom user
   DATABASE_URL="postgresql://globetrotter_user:secure_password_123@localhost:5432/globetrotter"
   ```

### Option 2: Docker PostgreSQL (Quick Start)

1. **Run PostgreSQL in Docker:**
   ```bash
   docker run --name globetrotter-postgres \
     -e POSTGRES_PASSWORD=mypassword \
     -e POSTGRES_DB=globetrotter \
     -p 5432:5432 \
     -d postgres:15
   ```

2. **Update .env.local:**
   ```env
   DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/globetrotter"
   ```

3. **Run Schema:**
   ```bash
   # Wait a moment for container to start, then:
   docker exec -i globetrotter-postgres psql -U postgres -d globetrotter < scripts/database-schema.sql
   docker exec -i globetrotter-postgres psql -U postgres -d globetrotter < scripts/sample-data.sql
   ```

### Option 3: Cloud Database (Production)

**Neon (Free PostgreSQL):**
1. Go to https://neon.tech
2. Create free account and database
3. Copy connection string to .env.local
4. Run schema via their web interface or psql

**Supabase (Free PostgreSQL):**
1. Go to https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string to .env.local
5. Use their SQL editor to run schema

## Environment Variables

Update your `.env.local` file:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth Configuration  
NEXTAUTH_SECRET="your-super-secret-jwt-key-make-it-long-and-random-123456789"
NEXTAUTH_URL="http://localhost:3001"

# Google Maps API (optional for now)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Weather API (optional for now)  
NEXT_PUBLIC_WEATHER_API_KEY=""

# Optional
NODE_ENV="development"
```

## Test Database Connection

Run this to test your database connection:
```bash
npm run dev
```

Then visit: http://localhost:3001/api/test-db

You should see: `{"message":"Database connected successfully","timestamp":"..."}`

## Troubleshooting

**Connection Failed:**
- Check PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Verify credentials in .env.local
- Check firewall/port 5432

**Permission Denied:**
- Make sure user has proper permissions
- Try using postgres superuser first

**Tables Not Found:**
- Run the schema file: `psql -U postgres -d globetrotter -f scripts/database-schema.sql`
- Check if tables exist: `\dt` in psql

## Sample Data

After setting up the database, you can add sample data:
```bash
psql -U postgres -d globetrotter -f scripts/sample-data.sql
```

This adds sample cities, activities, and a test user account.
