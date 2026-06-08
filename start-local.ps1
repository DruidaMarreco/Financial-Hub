# Financial Hub - Local Development Startup Script

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          🚀 FINANCIAL HUB - LOCAL STARTUP" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if database is running
$dbStatus = docker ps | Select-String "financial-hub-postgres"

if (-not $dbStatus) {
    Write-Host "Starting PostgreSQL Database..." -ForegroundColor Yellow
    docker run -d `
      --name financial-hub-postgres `
      -e POSTGRES_PASSWORD=postgres `
      -e POSTGRES_DB=financial_hub `
      -p 5432:5432 `
      postgres:15-alpine | Out-Null

    Write-Host "⏳ Waiting for database to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    Write-Host "✅ Database started!" -ForegroundColor Green
} else {
    Write-Host "✅ Database already running!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Yellow
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ ALL SYSTEMS READY!" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Your Financial Hub is ready to run:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Database:     localhost:5432 (postgres/postgres)" -ForegroundColor White
Write-Host "📍 Web App:      http://localhost:3000" -ForegroundColor White
Write-Host "📍 API:          http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "(Press Ctrl+C to stop)" -ForegroundColor Gray
Write-Host ""

npm run dev
