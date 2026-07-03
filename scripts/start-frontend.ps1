# Start Frontend Server Script
# Starts the frontend development server

Write-Host "🚀 Starting frontend server..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\frontend"
npm run dev
