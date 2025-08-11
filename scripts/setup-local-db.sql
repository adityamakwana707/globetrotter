-- Quick setup for local PostgreSQL database
-- Run this if you don't have a database set up yet

-- Create database (run this as postgres user)
-- CREATE DATABASE globetrotter;

-- Connect to the database and create a user
-- CREATE USER globetrotter_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE globetrotter TO globetrotter_user;

-- For local development, you can also use these simpler credentials:
-- User: postgres
-- Password: your_postgres_password
-- Database: globetrotter

-- Your DATABASE_URL should look like:
-- postgresql://postgres:your_password@localhost:5432/globetrotter
-- or
-- postgresql://globetrotter_user:your_secure_password@localhost:5432/globetrotter
