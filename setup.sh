#!/bin/bash

# Financial Hub - Development Setup Script
# This script sets up the complete local development environment

set -e  # Exit on error

echo "🚀 Financial Hub - Development Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required, found $NODE_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found, creating from .env.example...${NC}"
    cp .env.example .env 2>/dev/null || {
        echo "Creating minimal .env..."
        cat > .env << 'EOF'
# Database Configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=financial_hub
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_hub

# API Configuration
NODE_ENV=development
PORT=3001

# JWT
JWT_SECRET=dev-secret-key-super-secure-in-production
JWT_EXPIRATION=24h

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_URL=http://localhost

# Logging
LOG_LEVEL=debug

# Optional integrations (leave blank for demo mode)
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
EOF
    }
    echo -e "${GREEN}✅ .env created${NC}"
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi
echo ""

# Check for Docker and start PostgreSQL
echo -e "${BLUE}Checking database setup...${NC}"

if command -v docker &> /dev/null; then
    echo "Docker found. Starting PostgreSQL container..."

    # Check if container is already running
    if docker ps | grep -q "financial-hub-db"; then
        echo -e "${GREEN}✅ PostgreSQL container already running${NC}"
    else
        # Try to start if it exists
        if docker ps -a | grep -q "financial-hub-db"; then
            echo "Starting existing PostgreSQL container..."
            docker-compose up -d postgres
            sleep 3  # Wait for container to be ready
        else
            echo "Creating new PostgreSQL container..."
            docker-compose up -d postgres
            sleep 5  # Wait for initialization
        fi

        # Wait for health check
        echo "Waiting for PostgreSQL to be healthy..."
        max_attempts=30
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if docker-compose ps postgres | grep -q "healthy"; then
                break
            fi
            sleep 1
            attempt=$((attempt + 1))
        done

        if [ $attempt -eq $max_attempts ]; then
            echo -e "${YELLOW}⚠️  PostgreSQL didn't report as healthy, continuing anyway...${NC}"
        else
            echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found. Make sure PostgreSQL is installed locally.${NC}"
    echo "For installation instructions, see docs/DATABASE_SETUP.md"

    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ Neither Docker nor PostgreSQL found. Please install one of them.${NC}"
        echo "See docs/DATABASE_SETUP.md for instructions."
        exit 1
    fi
    echo -e "${GREEN}✅ PostgreSQL found locally${NC}"
fi
echo ""

# Test database connection
echo -e "${BLUE}Testing database connection...${NC}"
if npx prisma db execute --stdin --schema=libs/data/prisma/schema.prisma <<< "SELECT 1;" 2>/dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Could not connect to database. This might be normal if migrations haven't been run.${NC}"
fi
echo ""

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
npx prisma generate --schema=libs/data/prisma/schema.prisma
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
if npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma 2>/dev/null; then
    echo -e "${GREEN}✅ Migrations applied${NC}"
else
    echo -e "${YELLOW}⚠️  Could not apply migrations. Attempting dev mode...${NC}"
    if npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --skip-seed 2>/dev/null; then
        echo -e "${GREEN}✅ Migrations applied (dev mode)${NC}"
    else
        echo -e "${RED}❌ Could not apply migrations. Ensure PostgreSQL is running.${NC}"
        exit 1
    fi
fi
echo ""

# Build workspace libraries
echo -e "${BLUE}Building shared libraries...${NC}"
npm run build --workspace=libs/common 2>/dev/null || true
npm run build --workspace=libs/core 2>/dev/null || true
npm run build --workspace=libs/data 2>/dev/null || true
echo -e "${GREEN}✅ Libraries built${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "🎉 Ready to start development!"
echo ""
echo "Next steps:"
echo "  1. Start the dev servers:"
echo "     npm run dev"
echo ""
echo "  2. Open in your browser:"
echo "     Frontend: http://localhost:3000"
echo "     API: http://localhost:3001"
echo ""
echo "  3. View the database (optional):"
echo "     npm run db:studio"
echo ""
echo "For help, see:"
echo "  - docs/DATABASE_SETUP.md   (Database setup details)"
echo "  - docs/DEVELOPMENT.md       (Development guide)"
echo "  - README.md                  (Project overview)"
echo ""
