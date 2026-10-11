# Brancher - Run both server and client
# Usage: powershell -ExecutionPolicy Bypass -File run-brancher.ps1

Write-Host "Starting Brancher Application..." -ForegroundColor Cyan
Write-Host ""

$appPath = $PSScriptRoot
Set-Location -LiteralPath $appPath

Write-Host "Working directory: $appPath" -ForegroundColor Gray
Write-Host ""

# Kill any existing node processes
Write-Host "Cleaning up old processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Start server
Write-Host "Starting Backend Server on port 3000..." -ForegroundColor Green
$serverScript = "cd '$appPath'; npm start"
$serverProcess = Start-Process -FilePath powershell.exe -ArgumentList "-NoExit", "-NoProfile", "-Command", $serverScript -PassThru
$serverPID = $serverProcess.Id
Write-Host "Backend Server PID: $serverPID" -ForegroundColor Gray

# Wait for server to initialize
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# Start client
Write-Host "Starting Frontend Dev Server on port 5173..." -ForegroundColor Green
$clientScript = "cd '$appPath\client'; npm run dev"
$clientProcess = Start-Process -FilePath powershell.exe -ArgumentList "-NoExit", "-NoProfile", "-Command", $clientScript -PassThru
$clientPID = $clientProcess.Id
Write-Host "Frontend Dev Server PID: $clientPID" -ForegroundColor Gray

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "BRANCHER IS RUNNING!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "OPEN IN BROWSER:" -ForegroundColor Cyan
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host ""

Write-Host "Services:" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:3000  (PID: $serverPID)" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173  (PID: $clientPID)" -ForegroundColor White
Write-Host ""

Write-Host "To stop services, close both command windows" -ForegroundColor Yellow
