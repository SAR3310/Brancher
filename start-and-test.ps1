# Start server in background
Write-Host "Starting Brancher server..."
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\Users\Kentaro\Documents\Hermes-Project\brancher" -PassThru -NoNewWindow
Write-Host "Server started with PID: $($serverProcess.Id)"

# Wait for server to be ready
Write-Host "Waiting for server to be ready..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = & curl.exe -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/branches
        if ($response -eq "401") {
            $ready = $true
            Write-Host "✓ Server is ready!"
            break
        }
    } catch {
        Write-Host -NoNewline "."
    }
    Start-Sleep -Seconds 1
}

if (-not $ready) {
    Write-Host "✗ Server did not start"
    Stop-Process -Id $serverProcess.Id -Force
    exit 1
}

# Run tests
Write-Host "`nRunning E2E tests..."
Start-Sleep -Seconds 2
& node e2e-load-test.js
