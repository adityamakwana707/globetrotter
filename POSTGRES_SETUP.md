# PostgreSQL Setup for GlobeTrotter App

## Quick Setup Steps

### Option 1: Using pgAdmin (Recommended for beginners)

1. **Open pgAdmin** (should be installed with PostgreSQL)
   - Find it in Start Menu: "pgAdmin 4"
   
2. **Connect to PostgreSQL**
   - Right-click "Servers" → "Register" → "Server"
   - Name: `Local PostgreSQL`
   - Host: `localhost`
   - Port: `5432`
   - Username: `postgres`
   - Password: [Your postgres password set during installation]

3. **Create Database**
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `globetrotter_db`
   - Owner: `postgres`
   - Click "Save"

4. **Create User**
   - Right-click "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab: Name: `globetrotter`
   - Definition tab: Password: `globetrotter123`
   - Privileges tab: Check "Can login?" and "Superuser?"
   - Click "Save"

5. **Run Schema**
   - Right-click on `globetrotter_db` → "Query Tool"
   - Open and run `scripts/database-schema.sql`
   - Open and run `scripts/sample-data.sql`

### Option 2: Command Line (If you know your postgres password)

1. **Open Command Prompt as Administrator**

2. **Navigate to PostgreSQL bin directory**
   ```cmd
   cd "C:\Program Files\PostgreSQL\17\bin"
   ```

3. **Create database and user**
   ```cmd
   psql -U postgres -c "CREATE DATABASE globetrotter_db;"
   psql -U postgres -c "CREATE USER globetrotter WITH PASSWORD 'globetrotter123';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE globetrotter_db TO globetrotter;"
   psql -U postgres -c "ALTER USER globetrotter CREATEDB;"
   ```

4. **Run schema files**
   ```cmd
   psql -U globetrotter -d globetrotter_db -f "path\to\your\project\scripts\database-schema.sql"
   psql -U globetrotter -d globetrotter_db -f "path\to\your\project\scripts\sample-data.sql"
   ```

### Option 3: Reset PostgreSQL Password (If you forgot it)

1. **Stop PostgreSQL Service**
   - Open Services (services.msc)
   - Find "postgresql-x64-17" and stop it

2. **Edit pg_hba.conf**
   - Navigate to: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
   - Backup the file first
   - Change all "md5" to "trust" temporarily
   - Save the file

3. **Start PostgreSQL Service**

4. **Reset Password**
   ```cmd
   cd "C:\Program Files\PostgreSQL\17\bin"
   psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword123';"
   ```

5. **Restore pg_hba.conf**
   - Change "trust" back to "md5"
   - Restart PostgreSQL service

## Environment Configuration

Once PostgreSQL is set up, your `.env.local` should have:

```env
DATABASE_URL="postgresql://globetrotter:globetrotter123@localhost:5432/globetrotter_db"
```

## Test Connection

After setup, restart your Next.js app:

```bash
npm run dev
```

The app should now connect to PostgreSQL successfully!

## Troubleshooting

- **Connection refused**: PostgreSQL service is not running
- **Authentication failed**: Wrong password in DATABASE_URL
- **Database does not exist**: Database not created yet
- **Role does not exist**: User not created yet

Check the console logs for specific error messages.
