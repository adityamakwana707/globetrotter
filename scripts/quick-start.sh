#!/bin/bash

echo "Setting up GlobeTrotter Database..."
echo ""

echo "1. Make sure PostgreSQL is installed and running"
echo "2. Update your .env.local file with database credentials"
echo ""

echo "Creating database and tables..."
psql -U postgres -c "CREATE DATABASE globetrotter;" 2>/dev/null || echo "Database may already exist"
psql -U postgres -d globetrotter -f database-schema.sql
psql -U postgres -d globetrotter -f sample-data.sql

echo ""
echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your database URL"
echo "2. Run: npm run dev"
echo "3. Visit: http://localhost:3001"
echo ""
