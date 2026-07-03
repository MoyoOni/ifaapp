# Start Backend Server Script
# Kills any existing process on port 3000 and starts the backend server

Write-Host "🔍 Checking for existing backend on port 3000..." -ForegroundColor Cyan

# Find and kill process using port 3000
$port = 3000
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }

if ($connections) {
    foreach ($connection in $connections) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process -and $process.ProcessName -eq "node") {
            Write-Host "⚠️  Found existing Node process (PID: $processId) on port $port. Stopping..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host "✅ Port $port is now available" -ForegroundColor Green
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan

# Start backend
Set-Location "$PSScriptRoot\..\backend"
npm run dev
