# Database Setup Guide

This guide explains how to set up PostgreSQL for Financial Hub development and create the database schema via Prisma migrations.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 12 OR Docker

## Option 1: Using Docker (Recommended)

### Start PostgreSQL Container

```bash
# Start PostgreSQL using docker-compose
docker-compose up -d postgres

# Verify the container is running
docker-compose ps

# Expected output: postgres service should show "running" and "healthy"
```

The PostgreSQL container will:
- Listen on `localhost:5432` (mapped from container port 5432)
- Use credentials: `postgres` / `postgres`
- Create database: `financial_hub`
- Persist data in a Docker volume

### Create Database Schema

Once PostgreSQL is running:

```bash
# Run Prisma migrations to create the database schema
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma

# This will:
# 1. Create all tables defined in schema.prisma
# 2. Generate the Prisma client in @financial-hub/data
# 3. Seed initial data (if seed script exists)
```

### Verify the Setup

```bash
# Open Prisma Studio to view the database
npm run prisma:studio --workspace=@financial-hub/data

# This opens http://localhost:5555 in your browser with a database viewer
```

### Stop PostgreSQL

```bash
# Stop containers without removing them
docker-compose stop

# Stop and remove containers (data persists in volume)
docker-compose down

# Remove containers and delete data volume
docker-compose down -v
```

## Option 2: Local PostgreSQL Installation

### macOS (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create the database
createdb financial_hub

# Verify connection
psql -U postgres -d financial_hub -c "SELECT version();"
```

### Windows (using PostgreSQL Installer)

1. Download from https://www.postgresql.org/download/windows/
2. Run the installer and complete setup
3. Remember the password you set for the `postgres` user
4. Create the database:
   ```
   # Open Command Prompt or PowerShell
   createdb -U postgres financial_hub
   ```
5. Verify connection:
   ```
   psql -U postgres -d financial_hub -c "SELECT version();"
   ```

### Linux (using apt)

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql

# Create the database
sudo -u postgres createdb financial_hub

# Verify connection
sudo -u postgres psql -d financial_hub -c "SELECT version();"
```

### Run Migrations

```bash
# Ensure DATABASE_URL in .env points to your local PostgreSQL
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/financial_hub

# Run migrations
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma

# View database in Prisma Studio
npm run prisma:studio --workspace=@financial-hub/data
```

## Environment Variables

The `.env` file should contain:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_hub
```

For local development:
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres` (or your chosen password)
- **Database**: `financial_hub`

For Docker:
- The docker-compose.yml automatically sets these values

## Database Schema

The schema includes the following main tables:

- **users** — User accounts and authentication
- **user_profiles** — User preferences (currency, timezone, language)
- **accounts** — Bank accounts, credit cards, investment accounts
- **transactions** — Individual transactions
- **transaction_categories** — Custom categories for transactions
- **portfolio** — Investment portfolios
- **holdings** — Individual holdings within portfolios
- **portfolio_metrics** — Portfolio performance metrics
- **balance_history** — Historical balance snapshots
- **bank_integrations** — OAuth tokens for bank connections
- **sync_logs** — Sync operation logs

## Troubleshooting

### "Can't reach database server"

```bash
# Check if PostgreSQL is running
docker-compose ps  # If using Docker
# or
pg_isready -h localhost -p 5432  # If using local PostgreSQL

# Check .env DATABASE_URL is correct
cat .env | grep DATABASE_URL

# Verify credentials
psql -U postgres -h localhost -d postgres
```

### "Database does not exist"

```bash
# Create the database
createdb -U postgres financial_hub

# Or via psql
psql -U postgres -c "CREATE DATABASE financial_hub;"
```

### "Permission denied"

```bash
# Ensure the postgres user has permissions (usually default)
# Or create a new user
psql -U postgres -c "CREATE USER developer WITH PASSWORD 'password';"
psql -U postgres -c "ALTER USER developer CREATEDB;"
```

### Migrations Failed

```bash
# Reset database to empty state (⚠️ WARNING: Deletes all data)
npx prisma migrate reset --schema=libs/data/prisma/schema.prisma

# Or manually:
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --skip-seed
```

## Development Workflow

1. **Modify schema**: Edit `libs/data/prisma/schema.prisma`
2. **Create migration**: `npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --name "your_feature_name"`
3. **Commit**: Commit the migration file (in `libs/data/prisma/migrations/`)
4. **In production**: Run `npx prisma migrate deploy` to apply migrations

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)
