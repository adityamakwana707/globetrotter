#!/bin/bash

echo "========================================"
echo "  GlobeTrotter Enhanced Database Setup"
echo "========================================"
echo ""

echo "🗄️  Creating GlobeTrotter database..."
psql -U postgres -c "DROP DATABASE IF EXISTS globetrotter;" 2>/dev/null || echo "Database didn't exist, creating new one..."
psql -U postgres -c "CREATE DATABASE globetrotter;"

echo ""
echo "📋 Applying enhanced schema with hybrid ID system..."
psql -U postgres -d globetrotter -f enhanced-database-schema.sql

echo ""
echo "📊 Inserting sample data with cost/popularity metrics..."
psql -U postgres -d globetrotter -f enhanced-sample-data.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env.local with database URL"
echo "2. Test connection: npm run dev"
echo "3. Visit: http://localhost:3001/api/test-db"
echo ""
echo "🔧 Database URL format:"
echo 'DATABASE_URL="postgresql://postgres:your_password@localhost:5432/globetrotter"'
echo ""
