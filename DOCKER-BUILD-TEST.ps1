# ============================================================
# Brancher - Docker Build & Deployment Test Script
# Executes all Docker validation steps from production build
# ============================================================

param(
    [string]$ImageName = "brancher",
    [string]$ImageTag = "latest",
    [string]$ContainerName = "brancher-test",
    [string]$SessionSecret = "test-secret-123456789-production-ready",
    [int]$Port = 3000,
    [int]$HealthCheckWait = 10
)

$ErrorActionPreference = "Stop"
$Global:TestsPassed = 0
$Global:TestsFailed = 0

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host $Text -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
}

function Write-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message)
    $icon = $Passed ? "✅" : "❌"
    $color = $Passed ? "Green" : "Red"
    Write-Host "$icon $TestName" -ForegroundColor $color
    if ($Message) {
        Write-Host "   $Message" -ForegroundColor Gray
    }
    if ($Passed) {
        $Global:TestsPassed++
    } else {
        $Global:TestsFailed++
    }
}

function Test-Command {
    param([string]$Command)
    try {
        Invoke-Expression $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# ============================================================
# STEP 1: Verify Docker Installation
# ============================================================

Write-Header "STEP 1: Docker Environment Verification"

$dockerAvailable = Test-Command "docker --version"
Write-TestResult "Docker CLI Available" $dockerAvailable "Docker version: $(docker --version 2>$null)"

if (-not $dockerAvailable) {
    Write-Host "`n❌ FATAL: Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

$dockerRunning = Test-Command "docker ps"
Write-TestResult "Docker Daemon Running" $dockerRunning "Daemon is accessible"

if (-not $dockerRunning) {
    Write-Host "`n❌ FATAL: Docker daemon is not running" -ForegroundColor Red
    Write-Host "Start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# ============================================================
# STEP 2: Build Docker Image
# ============================================================

Write-Header "STEP 2: Docker Image Build"

Write-Host "Building Docker image: $ImageName`:$ImageTag" -ForegroundColor Cyan
Write-Host "This may take 2-5 minutes..." -ForegroundColor Gray

$buildOutput = & docker build -t "$ImageName`:$ImageTag" . 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

Write-TestResult "Docker Image Build" $buildSuccess

if (-not $buildSuccess) {
    Write-Host "`n❌ Docker build failed:" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
    exit 1
}

# ============================================================
# STEP 3: Verify Image Creation
# ============================================================

Write-Header "STEP 3: Docker Image Verification"

$imageExists = & docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^$ImageName`:$ImageTag$"
Write-TestResult "Image Tagged Correctly" ([bool]$imageExists)

$imageInfo = & docker image inspect "$ImageName`:$ImageTag" 2>$null | ConvertFrom-Json
$imageSizeGB = [math]::Round($imageInfo[0].Size / 1GB, 2)
$imageSizeCheck = $imageSizeGB -lt 0.5  # Should be less than 500MB

Write-TestResult "Image Size Reasonable" $imageSizeCheck "Size: ${imageSizeGB}GB (should be <0.5GB)"

# Check non-root user
$user = $imageInfo[0].Config.User
$nonRootUser = -not [string]::IsNullOrEmpty($user) -and $user -ne "root"
Write-TestResult "Non-Root User Configured" $nonRootUser "User: $user"

# Check volume mount
$volumes = $imageInfo[0].Config.Volumes
$volumeExists = $volumes -and $volumes.PSObject.Properties.Name -contains "/data"
Write-TestResult "Volume Mount Configured" $volumeExists "Volume: /data"

# Check exposed port
$port = $imageInfo[0].Config.ExposedPorts
$portExposed = $port -and $port.PSObject.Properties.Name -contains "3000/tcp"
Write-TestResult "Port 3000 Exposed" $portExposed

# Check entrypoint
$entrypoint = $imageInfo[0].Config.Entrypoint -join " "
$cmdCheck = $imageInfo[0].Config.Cmd -join " "
$startCommand = if ($entrypoint) { $entrypoint } else { $cmdCheck }
Write-TestResult "Start Command Configured" ([bool]$startCommand) "Command: $startCommand"

Write-Host "`nImage Details:" -ForegroundColor Cyan
Write-Host "  Repository: $($imageInfo[0].RepoTags[0])" -ForegroundColor Gray
Write-Host "  Created: $($imageInfo[0].Created)" -ForegroundColor Gray
Write-Host "  OS/Arch: $($imageInfo[0].Os)/$($imageInfo[0].Architecture)" -ForegroundColor Gray

# ============================================================
# STEP 4: Cleanup Existing Test Container
# ============================================================

Write-Header "STEP 4: Cleanup Previous Test Container"

$containerExists = & docker ps -a --format "{{.Names}}" | Select-String "^$ContainerName$"

if ($containerExists) {
    Write-Host "Stopping existing container: $ContainerName" -ForegroundColor Yellow
    & docker stop $ContainerName 2>$null | Out-Null
    Start-Sleep -Seconds 2
    
    Write-Host "Removing existing container: $ContainerName" -ForegroundColor Yellow
    & docker rm $ContainerName 2>$null | Out-Null
    Write-TestResult "Previous Container Cleaned" $true
} else {
    Write-TestResult "No Previous Container Found" $true
}

# Remove old volume if exists
$volumeExists = & docker volume ls --format "{{.Name}}" | Select-String "^brancher-data$"
if ($volumeExists) {
    Write-Host "Removing old volume for fresh test" -ForegroundColor Yellow
    & docker volume rm brancher-data 2>$null | Out-Null
}

# ============================================================
# STEP 5: Run Docker Container
# ============================================================

Write-Header "STEP 5: Docker Container Startup"

Write-Host "Starting container: $ContainerName" -ForegroundColor Cyan
Write-Host "Environment:" -ForegroundColor Gray
Write-Host "  SESSION_SECRET: ****" -ForegroundColor Gray
Write-Host "  PORT: $Port" -ForegroundColor Gray
Write-Host "  Volume: brancher-data:/data" -ForegroundColor Gray

$runOutput = & docker run -d `
    --name $ContainerName `
    -p "$Port`:3000" `
    -e "SESSION_SECRET=$SessionSecret" `
    -e "PORT=3000" `
    -e "NODE_ENV=production" `
    -v brancher-data:/data `
    "$ImageName`:$ImageTag" 2>&1

$runSuccess = $LASTEXITCODE -eq 0
Write-TestResult "Container Started" $runSuccess

if (-not $runSuccess) {
    Write-Host "`n❌ Failed to start container:" -ForegroundColor Red
    Write-Host $runOutput -ForegroundColor Red
    exit 1
}

$containerId = $runOutput
Write-Host "Container ID: $containerId" -ForegroundColor Gray

# ============================================================
# STEP 6: Wait for Container Startup
# ============================================================

Write-Header "STEP 6: Container Startup Verification"

Write-Host "Waiting $HealthCheckWait seconds for container to start..." -ForegroundColor Cyan

for ($i = 0; $i -lt $HealthCheckWait; $i++) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host ""

# ============================================================
# STEP 7: Container Runtime Checks
# ============================================================

Write-Header "STEP 7: Container Runtime Validation"

# Check if container is still running
$containerRunning = & docker ps --format "{{.Names}}" | Select-String "^$ContainerName$"
Write-TestResult "Container Running" ([bool]$containerRunning)

if (-not $containerRunning) {
    Write-Host "`n⚠️  Container is not running. Checking logs:" -ForegroundColor Yellow
    $logs = & docker logs $ContainerName 2>&1
    Write-Host $logs -ForegroundColor Red
    & docker rm $ContainerName 2>$null | Out-Null
    exit 1
}

# Get container details
$containerInfo = & docker inspect $ContainerName 2>$null | ConvertFrom-Json
$containerState = $containerInfo[0].State.Running
$containerPid = $containerInfo[0].State.Pid

Write-Host "Container State:" -ForegroundColor Cyan
Write-Host "  Running: $containerState" -ForegroundColor Gray
Write-Host "  PID: $containerPid" -ForegroundColor Gray
Write-Host "  Uptime: $($containerInfo[0].State.StartedAt)" -ForegroundColor Gray

# ============================================================
# STEP 8: Port Binding Verification
# ============================================================

Write-Header "STEP 8: Port & Network Verification"

$portBindings = $containerInfo[0].NetworkSettings.Ports."3000/tcp"
$portBound = $null -ne $portBindings -and $portBindings.HostPort -eq "3000"
Write-TestResult "Port 3000 Bound to Host" $portBound "Host Port: $($portBindings.HostPort)"

$ipAddress = $containerInfo[0].NetworkSettings.Networks.bridge.IPAddress
Write-Host "Container IP: $ipAddress" -ForegroundColor Gray

# ============================================================
# STEP 9: Health Check via HTTP
# ============================================================

Write-Header "STEP 9: HTTP Health Check"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" `
        -TimeoutSec 5 -SkipHttpErrorCheck -ErrorAction SilentlyContinue
    
    $healthCheckPassed = $response.StatusCode -eq 200
    Write-TestResult "Health Endpoint Responds" $healthCheckPassed "Status Code: $($response.StatusCode)"
    
    if ($response.Content) {
        try {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
        } catch {
            Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
        }
    }
} catch {
    Write-TestResult "Health Endpoint Responds" $false "Connection failed: $_"
    Write-Host "Container may still be starting up..." -ForegroundColor Yellow
}

# ============================================================
# STEP 10: Container Logs
# ============================================================

Write-Header "STEP 10: Container Logs Analysis"

$logs = & docker logs $ContainerName 2>&1
$logLines = ($logs | Measure-Object -Line).Lines

Write-Host "Last 20 log lines:" -ForegroundColor Cyan
$logSplit = $logs -split "`n"
$startLine = [Math]::Max(0, $logSplit.Length - 20)
$logSplit[$startLine..($logSplit.Length-1)] | ForEach-Object {
    if ($_) {
        $color = if ($_ -like "*error*" -or $_ -like "*Error*") { "Red" } `
                elseif ($_ -like "*warning*" -or $_ -like "*Warning*") { "Yellow" } `
                else { "Gray" }
        Write-Host "  $_" -ForegroundColor $color
    }
}

$noErrors = -not ($logs | Select-String -Pattern "error|fatal" -CaseSensitive)
Write-TestResult "No Fatal Errors in Logs" $noErrors "Log lines: $logLines"

# ============================================================
# STEP 11: Volume Verification
# ============================================================

Write-Header "STEP 11: Volume & Data Persistence"

try {
    $volumeData = & docker exec $ContainerName ls -la /data 2>&1
    $volumeAccessible = $LASTEXITCODE -eq 0
    Write-TestResult "Volume Accessible in Container" $volumeAccessible
    
    Write-Host "Volume contents:" -ForegroundColor Gray
    $volumeData | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} catch {
    Write-TestResult "Volume Accessible in Container" $false "Error accessing volume"
}

# ============================================================
# STEP 12: Resource Usage
# ============================================================

Write-Header "STEP 12: Container Resource Usage"

$stats = & docker stats $ContainerName --no-stream --format "{{.CPUPerc}}" 2>&1
Write-Host "Current Resource Usage:" -ForegroundColor Cyan
& docker stats $ContainerName --no-stream | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

# ============================================================
# STEP 13: Security Verification
# ============================================================

Write-Header "STEP 13: Security Validation"

$user = $containerInfo[0].Config.User
$runningUser = $user -or $containerInfo[0].Config.User
$nonRootTest = $user -eq "1001:1001" -or $user -eq "nodejs"
Write-TestResult "Running as Non-Root User" $nonRootTest "User: $runningUser"

# Check for exposed secrets in environment
$envVars = $containerInfo[0].Config.Env
$hasSecrets = $envVars | Where-Object { $_ -like "*SECRET*" -or $_ -like "*PASSWORD*" -or $_ -like "*KEY*" }
Write-TestResult "No Hardcoded Secrets in Image" (-not $hasSecrets)

# ============================================================
# STEP 14: Volume Persistence Test
# ============================================================

Write-Header "STEP 14: Volume Persistence Test"

Write-Host "Testing data persistence across container restarts..." -ForegroundColor Cyan

# Create a test file in the volume
& docker exec $ContainerName sh -c "echo 'test-data-$(Get-Date -Format 'yyyyMMddHHmmss')' > /data/persistence-test.txt" 2>$null
$testFileCreated = $LASTEXITCODE -eq 0
Write-TestResult "Test File Written to Volume" $testFileCreated

if ($testFileCreated) {
    # Stop and remove container
    Write-Host "Stopping container..." -ForegroundColor Yellow
    & docker stop $ContainerName 2>$null | Out-Null
    & docker rm $ContainerName 2>$null | Out-Null
    Start-Sleep -Seconds 3
    
    # Start new container with same volume
    Write-Host "Starting new container with same volume..." -ForegroundColor Yellow
    $runOutput = & docker run -d `
        --name "$ContainerName-2" `
        -p "3001:3000" `
        -e "SESSION_SECRET=$SessionSecret" `
        -v brancher-data:/data `
        "$ImageName`:$ImageTag" 2>&1
    
    Start-Sleep -Seconds 5
    
    # Check if test file still exists
    $testFileContent = & docker exec "$ContainerName-2" cat /data/persistence-test.txt 2>&1
    $persistenceWorking = $LASTEXITCODE -eq 0
    Write-TestResult "Data Persisted Across Restarts" $persistenceWorking "File contents: $testFileContent"
    
    # Cleanup
    & docker stop "$ContainerName-2" 2>$null | Out-Null
    & docker rm "$ContainerName-2" 2>$null | Out-Null
    $ContainerName = "$ContainerName-2"
} else {
    Write-TestResult "Volume Persistence Test" $false "Could not create test file"
}

# ============================================================
# STEP 15: Final Cleanup
# ============================================================

Write-Header "STEP 15: Test Cleanup"

# Stop and remove test container
if (& docker ps -a --format "{{.Names}}" | Select-String "^$ContainerName") {
    & docker stop $ContainerName 2>$null | Out-Null
    & docker rm $ContainerName 2>$null | Out-Null
    Write-TestResult "Test Container Removed" $true
}

# Keep volume for manual inspection (optional)
Write-Host "`n💾 Volume 'brancher-data' kept for inspection" -ForegroundColor Gray
Write-Host "Remove with: docker volume rm brancher-data" -ForegroundColor Gray

# ============================================================
# SUMMARY
# ============================================================

Write-Header "DOCKER DEPLOYMENT TEST SUMMARY"

$totalTests = $Global:TestsPassed + $Global:TestsFailed
$passPercentage = if ($totalTests -gt 0) { [math]::Round(($Global:TestsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host "Tests Passed:  ✅ $($Global:TestsPassed)" -ForegroundColor Green
Write-Host "Tests Failed:  ❌ $($Global:TestsFailed)" -ForegroundColor $(if ($Global:TestsFailed -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate:  📊 $passPercentage%" -ForegroundColor $(if ($passPercentage -ge 90) { "Green" } else { "Yellow" })

if ($Global:TestsFailed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED - Docker image is production-ready!" -ForegroundColor Green
    Write-Host "Image: $ImageName`:$ImageTag" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  SOME TESTS FAILED - Review logs above" -ForegroundColor Yellow
    exit 1
}
