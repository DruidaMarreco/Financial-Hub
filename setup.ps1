# Financial Hub - Development Setup Script (PowerShell)
# This script sets up the complete local development environment

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Financial Hub - Development Setup" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Cyan
$nodeVersion = node -v
$nodeMajor = [int]($nodeVersion.Substring(1).Split('.')[0])

if ($nodeMajor -lt 18) {
    Write-Host "❌ Node.js 18+ required, found $nodeVersion" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion`n" -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
Write-Host "✅ Dependencies installed`n" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found, creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "Creating minimal .env..." -ForegroundColor Yellow
        @"
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
"@ | Out-File ".env" -Encoding UTF8
    }
    Write-Host "✅ .env created`n" -ForegroundColor Green
} else {
    Write-Host "✅ .env already exists`n" -ForegroundColor Green
}

# Check for Docker
Write-Host "Checking database setup..." -ForegroundColor Cyan

$dockerInstalled = $false
try {
    $null = docker --version
    $dockerInstalled = $true
} catch {
    # Docker not found
}

if ($dockerInstalled) {
    Write-Host "Docker found. Checking PostgreSQL container..." -ForegroundColor Yellow

    # Check if container is running
    $containerRunning = $false
    try {
        $output = docker ps 2>&1
        if ($output -like "*financial-hub-db*") {
            $containerRunning = $true
        }
    } catch {
        # Ignore errors from docker ps
    }

    if ($containerRunning) {
        Write-Host "✅ PostgreSQL container already running`n" -ForegroundColor Green
    } else {
        Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
        try {
            docker-compose up -d postgres
            Start-Sleep -Seconds 5
            Write-Host "✅ PostgreSQL started`n" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not start PostgreSQL via Docker" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  Docker not found. Make sure PostgreSQL is installed locally." -ForegroundColor Yellow
    Write-Host "For installation instructions, see docs/DATABASE_SETUP.md`n" -ForegroundColor Yellow

    # Check if psql is available
    $psqlFound = $false
    try {
        $null = psql --version 2>&1
        $psqlFound = $true
    } catch {
        # psql not found
    }

    if (-not $psqlFound) {
        Write-Host "❌ Neither Docker nor PostgreSQL found. Please install one of them." -ForegroundColor Red
        Write-Host "See docs/DATABASE_SETUP.md for instructions.`n" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ PostgreSQL found locally`n" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate --schema=libs/data/prisma/schema.prisma
Write-Host "✅ Prisma client generated`n" -ForegroundColor Green

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
try {
    npx prisma migrate deploy --schema=libs/data/prisma/schema.prisma 2>&1
    Write-Host "✅ Migrations applied`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not apply migrations. Attempting dev mode..." -ForegroundColor Yellow
    try {
        npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --skip-seed 2>&1
        Write-Host "✅ Migrations applied (dev mode)`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not apply migrations. Ensure PostgreSQL is running.`n" -ForegroundColor Red
        exit 1
    }
}

# Build libraries
Write-Host "Building shared libraries..." -ForegroundColor Cyan
npm run build --workspace=libs/common 2>&1 | Out-Null
npm run build --workspace=libs/core 2>&1 | Out-Null
npm run build --workspace=libs/data 2>&1 | Out-Null
Write-Host "✅ Libraries built`n" -ForegroundColor Green

# Success
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "🎉 Ready to start development!`n" -ForegroundColor Yellow

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the dev servers:"
Write-Host "     npm run dev`n"

Write-Host "  2. Open in your browser:"
Write-Host "     Frontend: http://localhost:3000"
Write-Host "     API: http://localhost:3001`n"

Write-Host "  3. View the database (optional):"
Write-Host "     npm run db:studio`n"

Write-Host "For help, see:" -ForegroundColor Cyan
Write-Host "  - docs/DATABASE_SETUP.md   (Database setup details)"
Write-Host "  - docs/DEVELOPMENT.md       (Development guide)"
Write-Host "  - README.md                  (Project overview)`n"
