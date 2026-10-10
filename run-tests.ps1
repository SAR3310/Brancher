# Stop any existing node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start server
Write-Host "Starting server..."
$serverJob = Start-Job -ScriptBlock {
    cd 'C:\Users\Kentaro\Documents\Hermes-Project\brancher'
    & npm start
}

# Wait for server startup
Write-Host "Waiting for server to start..."
Start-Sleep -Seconds 5

# Verify connectivity
$maxRetries = 10
$retries = 0
$connected = $false

while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/branches" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $connected = $true
        Write-Host "✓ Server is running and responding"
        break
    } catch {
        Write-Host -NoNewline "."
        $retries++
        Start-Sleep -Seconds 1
    }
}

if (-not $connected) {
    Write-Host "`n✗ Failed to connect to server"
    Stop-Job -Job $serverJob
    exit 1
}

# Run tests
Write-Host "`nRunning tests..."
& node e2e-load-test.js

# Keep server running for a bit
Write-Host "`nTest complete. Server will continue running."
