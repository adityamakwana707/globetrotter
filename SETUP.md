# Globetrotter App Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.local` and update the following variables:

   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/globetrotter_db"
   
   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-here-change-this-in-production"
   
   # Email Configuration - Optional
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT="587"
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@globetrotter.com"
   
   # Environment
   NODE_ENV="development"
   ```

3. **Database Setup:**
   - Create a PostgreSQL database named `globetrotter_db`
   - Run the SQL scripts in the `scripts/` folder:
     ```bash
     psql -U username -d globetrotter_db -f scripts/database-schema.sql
     psql -U username -d globetrotter_db -f scripts/sample-data.sql
     ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Access the Application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**
   ```bash
   # Kill process using port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Database connection issues:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

3. **Authentication issues:**
   - Verify NEXTAUTH_SECRET is set
   - Check database connection for user registration/login

## Project Structure

```
globetrotter-app/
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── lib/                 # Utility functions and configurations
├── scripts/             # Database setup scripts
└── public/              # Static assets
```

## Dependencies

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Authentication:** NextAuth.js (Email/Password only)
- **Database:** PostgreSQL with pg driver
- **UI Components:** Radix UI primitives
- **Forms:** React Hook Form with Zod validation
