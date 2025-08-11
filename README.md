# GlobeTrotter - Travel Planning Application

A comprehensive travel planning web application built with Next.js 14, featuring intelligent itinerary building, budget management, and collaborative trip planning.

## Features

- **Authentication System**: Secure JWT-based authentication with email/password
- **Trip Management**: Create, edit, and manage travel itineraries
- **Budget Tracking**: Real-time expense tracking with currency conversion
- **Collaborative Planning**: Share trips and collaborate with others
- **Smart Recommendations**: AI-powered destination and activity suggestions
- **Responsive Design**: Mobile-first design with dark theme

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL with raw SQL queries
- **Authentication**: NextAuth.js with JWT
- **External APIs**: Google Maps, Weather API, Currency Exchange API

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Maps API key
- Weather API key
- Currency API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/globetrotter-app.git
cd globetrotter-app
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Fill in your database URL and API keys in `.env.local`

4. Set up the database:
\`\`\`bash
# Create the database schema
psql -d your_database_url -f scripts/database-schema.sql

# Insert sample data (optional)
psql -d your_database_url -f scripts/sample-data.sql
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `trips` - Travel itineraries
- `cities` - Destination cities
- `activities` - Things to do in cities
- `trip_cities` - Cities included in trips
- `trip_activities` - Activities scheduled in trips
- `budgets` - Budget categories for trips
- `shared_trips` - Trip sharing and collaboration
- `expenses` - Expense tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Trips
- `GET /api/trips` - Get user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/[id]` - Get specific trip
- `PUT /api/trips/[id]` - Update trip
- `DELETE /api/trips/[id]` - Delete trip

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Admin (Admin access required)
- `GET /api/admin/stats` - Get platform statistics and analytics
- `GET /api/admin/users` - Get user analytics and management
- `PUT /api/admin/users` - Update user roles
- `GET /api/admin/analytics` - Get popular cities and activities data

## Admin Dashboard

The application includes a comprehensive admin dashboard for platform management:

### Admin Features
- **Platform Statistics**: Total users, trips, budget tracking
- **User Management**: View user analytics, manage roles (admin/moderator/user)
- **Content Analytics**: Popular cities and activities tracking
- **Growth Metrics**: User and trip growth charts
- **System Health**: Real-time platform metrics

### Admin Access
1. Set a user's role to 'admin' in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```
2. Or use the sample admin user:
   - Email: `admin@globetrotter.com`
   - Password: `admin123`
   - (Created by running `scripts/admin-sample-data.sql`)

### Admin Routes
- `/admin` - Main admin dashboard
- Admin button appears in main dashboard header for admin users

## Project Structure

\`\`\`
globetrotter-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components
│   └── providers/        # Context providers
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication config
│   └── database.ts       # Database functions
├── scripts/              # Database scripts
└── public/               # Static assets
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@globetrotter.com or create an issue on GitHub.
