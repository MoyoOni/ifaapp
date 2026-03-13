#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start Ìlú Àṣẹ staging environment with Docker Compose
    
.DESCRIPTION
    Builds and starts all services (PostgreSQL, Redis, Backend, Frontend)
    Runs database migrations and health checks
    
.PARAMETER Force
    Force rebuild of backend image
    
.PARAMETER Seed
    Seed demo data into staging database
#>

param(
    [switch]$Force,
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "🚀 Starting Ìlú Àṣẹ Staging Environment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if .env.staging.local exists
if (-not (Test-Path "$scriptDir\.env.staging.local")) {
    Write-Host "❌ .env.staging.local not found!" -ForegroundColor Red
    Write-Host "Please copy .env.staging to .env.staging.local and fill in real values" -ForegroundColor Yellow
    exit 1
}
$envFile = "$scriptDir\.env.staging.local"

# Stop existing containers if Force flag is set
if ($Force) {
    Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile down --remove-orphans
}

# Build backend if needed
Write-Host "`n🔨 Building services..." -ForegroundColor Yellow
docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile build --no-cache:$(!$Force)

# Start all services
Write-Host "`n⬆️  Starting services..." -ForegroundColor Yellow
docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile up -d

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$postgresHealthy = $false
$redisHealthy = $false
$backendHealthy = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    # Check PostgreSQL
    try {
        $postgres = docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile exec -T postgres pg_isready -U staging_user -d ilu_ase_staging 2>/dev/null
        $postgresHealthy = $LASTEXITCODE -eq 0
    } catch {
        $postgresHealthy = $false
    }
    
    # Check Redis
    try {
        $redis = docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile exec -T redis redis-cli ping 2>/dev/null
        $redisHealthy = $redis -like "*PONG*" -or $redis -like "*OK*"
    } catch {
        $redisHealthy = $false
    }
    
    # Check Backend
    try {
        $backend = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -ErrorAction SilentlyContinue
        $backendHealthy = $backend.StatusCode -eq 200
    } catch {
        $backendHealthy = $false
    }
    
    if ($postgresHealthy -and $redisHealthy -and $backendHealthy) {
        Write-Host "✅ All services healthy!" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 2
}

if (-not ($postgresHealthy -and $redisHealthy -and $backendHealthy)) {
    Write-Host "⚠️  Some services not healthy yet (may take longer to initialize)" -ForegroundColor Yellow
    Write-Host "PostgreSQL: $(if ($postgresHealthy) { '✅' } else { '⏳' })" -ForegroundColor Gray
    Write-Host "Redis: $(if ($redisHealthy) { '✅' } else { '⏳' })" -ForegroundColor Gray
    Write-Host "Backend: $(if ($backendHealthy) { '✅' } else { '⏳' })" -ForegroundColor Gray
}

# Run database migrations
Write-Host "`n🔄 Running database migrations..." -ForegroundColor Yellow
docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile exec -T backend npm run migrate:deploy 2>&1 | Select-Object -Last 10

# Optionally seed data
if ($Seed) {
    Write-Host "`n🌱 Seeding demo data..." -ForegroundColor Yellow
    docker-compose -f "$scriptDir/docker-compose.staging.yml" --env-file $envFile exec -T backend npm run seed 2>&1 | Select-Object -Last 10
}

# Build frontend
Write-Host "`n🏗️  Building frontend..." -ForegroundColor Yellow
Push-Location "$scriptDir\frontend"
npm run build 2>&1 | Select-Object -Last 5
Pop-Location

# Show access information
Write-Host "`n" -ForegroundColor Cyan
Write-Host "✅ Staging environment started!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:4040" -ForegroundColor Cyan
Write-Host "API:       http://localhost:8080" -ForegroundColor Cyan
Write-Host "Swagger:   http://localhost:8080/api/docs" -ForegroundColor Cyan
Write-Host "Database:  localhost:5433" -ForegroundColor Cyan
Write-Host "Redis:     localhost:6380" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n📝 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:     docker-compose -f docker-compose.staging.yml logs -f backend" -ForegroundColor Gray
Write-Host "  DB shell:      docker-compose -f docker-compose.staging.yml exec postgres psql -U staging_user -d ilu_ase_staging" -ForegroundColor Gray
Write-Host "  Stop:          docker-compose -f docker-compose.staging.yml down" -ForegroundColor Gray
Write-Host "  Restart:       docker-compose -f docker-compose.staging.yml restart" -ForegroundColor Gray

Write-Host "`n🚀 Ready to test! Open http://localhost:4040 in your browser." -ForegroundColor Green
