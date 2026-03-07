#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Staging Smoke Test Script - Validates production-like environment
    
.DESCRIPTION
    Runs critical tests to ensure staging is production-ready
    Tests: Auth, API responses, database, Sentry, performance
    
.PARAMETER Skip
    Skip specific tests (comma-separated): auth,api,db,sentry,performance
#>

param(
    [string]$Skip = ""
)

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8080"
$frontendUrl = "http://localhost:3000"
$passCount = 0
$failCount = 0
$skipTests = $Skip.Split(',').Trim()

function Test-Result {
    param($name, $result, $details = "")
    if ($result) {
        Write-Host "✅ $name" -ForegroundColor Green
        $global:passCount++
    } else {
        Write-Host "❌ $name" -ForegroundColor Red
        if ($details) { Write-Host "   $details" -ForegroundColor Red }
        $global:failCount++
    }
}

Write-Host "🧪 Staging Smoke Tests" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. HEALTH CHECK
# ============================================
if ($skipTests -notcontains "health") {
    Write-Host "📊 HEALTH CHECK" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/health" -ErrorAction SilentlyContinue
        Test-Result "API Health Check" ($response.StatusCode -eq 200)
    } catch {
        Test-Result "API Health Check" $false "Unable to reach /health"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/docs" -ErrorAction SilentlyContinue
        Test-Result "Swagger Documentation" ($response.StatusCode -eq 200)
    } catch {
        Test-Result "Swagger Documentation" $false "Unable to reach /api/docs"
    }
}

# ============================================
# 2. AUTHENTICATION
# ============================================
if ($skipTests -notcontains "auth") {
    Write-Host "`n🔐 AUTHENTICATION" -ForegroundColor Yellow
    
    $testEmail = "smoketest_$(Get-Random)@test.local"
    $testPassword = "Test123!@#456"
    
    # Signup
    try {
        $signupBody = @{
            email = $testEmail
            password = $testPassword
            name = "Smoke Test User"
            role = "client"
        } | ConvertTo-Json
        
        $signupResponse = Invoke-RestMethod -Uri "$baseUrl/auth/signup" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $signupBody `
            -ErrorAction SilentlyContinue
        
        Test-Result "User Signup" ($signupResponse.id -ne $null)
        $userId = $signupResponse.id
    } catch {
        Test-Result "User Signup" $false "Signup failed: $_"
        $userId = $null
    }
    
    # Login
    try {
        $loginBody = @{
            email = $testEmail
            password = $testPassword
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $loginBody `
            -ErrorAction SilentlyContinue
        
        Test-Result "User Login" ($loginResponse.accessToken -ne $null)
        $jwtToken = $loginResponse.accessToken
    } catch {
        Test-Result "User Login" $false "Login failed: $_"
        $jwtToken = $null
    }
    
    # Get Current User
    if ($jwtToken) {
        try {
            $userResponse = Invoke-RestMethod -Uri "$baseUrl/users/me" `
                -Method GET `
                -Headers @{"Authorization"="Bearer $jwtToken"} `
                -ErrorAction SilentlyContinue
            
            Test-Result "Get Current User" ($userResponse.id -eq $userId)
        } catch {
            Test-Result "Get Current User" $false "Failed to get user profile"
        }
    }
}

# ============================================
# 3. DATABASE
# ============================================
if ($skipTests -notcontains "db") {
    Write-Host "`n🗄️  DATABASE" -ForegroundColor Yellow
    
    try {
        $dbCheck = docker-compose -f docker-compose.staging.yml exec -T postgres `
            pg_isready -U staging_user -d ilu_ase_staging 2>/dev/null
        Test-Result "PostgreSQL Connection" ($LASTEXITCODE -eq 0)
    } catch {
        Test-Result "PostgreSQL Connection" $false "Database not responding"
    }
    
    try {
        $tableCount = docker-compose -f docker-compose.staging.yml exec -T postgres `
            psql -U staging_user -d ilu_ase_staging -tc `
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null
        
        $hasData = [int]$tableCount -gt 0
        Test-Result "Database Tables Created" $hasData
    } catch {
        Test-Result "Database Tables Created" $false "Failed to query tables"
    }
}

# ============================================
# 4. API ENDPOINTS
# ============================================
if ($skipTests -notcontains "api") {
    Write-Host "`n🔌 API ENDPOINTS" -ForegroundColor Yellow
    
    $endpoints = @(
        @{ method = "GET"; path = "/api/temples"; name = "List Temples" },
        @{ method = "GET"; path = "/api/courses"; name = "List Courses" },
        @{ method = "GET"; path = "/api/marketplace/products"; name = "List Products" }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri "$baseUrl$($endpoint.path)" `
                -Method $endpoint.method `
                -ErrorAction SilentlyContinue
            Test-Result $endpoint.name ($response.StatusCode -eq 200)
        } catch {
            Test-Result $endpoint.name $false "Endpoint returned error"
        }
    }
}

# ============================================
# 5. REDIS CACHE
# ============================================
if ($skipTests -notcontains "redis") {
    Write-Host "`n💾 REDIS CACHE" -ForegroundColor Yellow
    
    try {
        $redisPing = docker-compose -f docker-compose.staging.yml exec -T redis `
            redis-cli ping 2>/dev/null
        Test-Result "Redis Connection" ($redisPing -like "*PONG*" -or $redisPing -like "*OK*")
    } catch {
        Test-Result "Redis Connection" $false "Redis not responding"
    }
}

# ============================================
# 6. PERFORMANCE
# ============================================
if ($skipTests -notcontains "performance") {
    Write-Host "`n⚡ PERFORMANCE" -ForegroundColor Yellow
    
    $times = @()
    
    for ($i = 0; $i -lt 5; $i++) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            Invoke-WebRequest -Uri "$baseUrl/health" -ErrorAction SilentlyContinue | Out-Null
        } catch { }
        $stopwatch.Stop()
        $times += $stopwatch.ElapsedMilliseconds
    }
    
    $avgTime = ($times | Measure-Object -Average).Average
    $maxTime = ($times | Measure-Object -Maximum).Maximum
    
    Test-Result "Average Response Time <200ms" ($avgTime -lt 200) "Avg: ${avgTime}ms, Max: ${maxTime}ms"
    Test-Result "Max Response Time <500ms" ($maxTime -lt 500)
}

# ============================================
# 7. SENTRY INTEGRATION
# ============================================
if ($skipTests -notcontains "sentry") {
    Write-Host "`n📡 SENTRY INTEGRATION" -ForegroundColor Yellow
    
    $sentryUrl = $env:SENTRY_DSN
    if ($sentryUrl -and $sentryUrl -ne "") {
        Write-Host "✅ Sentry DSN Configured" -ForegroundColor Green
        $passCount++
        Write-Host "   (Check Sentry dashboard for error reports)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Sentry DSN Not Configured" -ForegroundColor Yellow
        Write-Host "   Set SENTRY_DSN in .env.staging.local for error tracking" -ForegroundColor Gray
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan
Write-Host "✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

if ($failCount -eq 0) {
    Write-Host "`n🎉 All tests passed! Staging is ready." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Check logs and troubleshoot." -ForegroundColor Yellow
    Write-Host "   View logs: docker-compose -f docker-compose.staging.yml logs -f" -ForegroundColor Gray
    exit 1
}
