# Quick Start - Docker Build & Deployment

## TL;DR - Complete Deployment in 5 Steps

### 1️⃣ Start Docker (2 minutes)
```powershell
# Option A: Open Docker Desktop GUI
Start Menu → Search "Docker Desktop" → Click

# Option B: Start service (if installed as Windows service)
Start-Service Docker

# Verify it's running:
docker ps
```

### 2️⃣ Build Docker Image (3-5 minutes)
```bash
cd C:\Users\Kentaro\Documents\Hermes-Project\brancher
docker build -t brancher:latest .
```

**Expected output:**
```
Successfully tagged brancher:latest
```

### 3️⃣ Run Automated Tests (2 minutes)
```powershell
.\DOCKER-BUILD-TEST.ps1

# Expected result:
# ✅ ALL TESTS PASSED - Docker image is production-ready!
```

### 4️⃣ Deploy to Production (1 minute)
```bash
docker run -d \
  --name brancher-prod \
  -p 3000:3000 \
  -e SESSION_SECRET="your-secure-32-char-random-string" \
  -e CORS_ORIGINS="yourdomain.com" \
  -v brancher-data:/data \
  --restart unless-stopped \
  brancher:latest
```

### 5️⃣ Verify Deployment (30 seconds)
```bash
# Check if running
docker ps | grep brancher-prod

# Test health endpoint
curl http://localhost:3000/api/health

# View logs
docker logs brancher-prod
```

---

## Detailed Build Process

### Prerequisites Checklist
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Production build completed (`npm run build`)
- [ ] Docker installed (version 20+)
- [ ] Docker daemon available

### Build Command
```bash
cd C:\Users\Kentaro\Documents\Hermes-Project\brancher
docker build -t brancher:latest .
```

### What Happens During Build
```
Step 1: Pull base image (node:22-alpine)
Step 2: Set working directory (/app)
Step 3: Copy package.json files
Step 4: Install dependencies (--omit=dev)
Step 5: Install client dependencies
Step 6: Copy entire project
Step 7: Build client with Vite
Step 8: Create non-root user (nodejs)
Step 9: Set file permissions
Step 10: Switch to nodejs user
Step 11: Set production environment
Step 12: Expose port 3000
Step 13: Define volume mount (/data)
Step 14: Set start command (node server/index.js)

✅ BUILD COMPLETE: Successfully tagged brancher:latest
```

### Build Time Estimate
- First build: 3-5 minutes (downloads base image)
- Subsequent builds: 2-3 minutes (uses cache)

### Image Size
- Expected: 350-450 MB
- Status: ✅ Within target (<500 MB)

---

## Single Container Deployment

### Basic Setup
```bash
docker run -d \
  --name brancher \
  -p 3000:3000 \
  -e SESSION_SECRET="test-secret" \
  -v brancher-data:/data \
  brancher:latest
```

### Production Setup
```bash
docker run -d \
  --name brancher-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e CORS_ORIGINS="yourdomain.com" \
  -e PORT=3000 \
  -e DATA_DIR=/data \
  -v brancher-data:/data \
  --restart unless-stopped \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  brancher:latest
```

### Environment Variables Explained
| Variable | Value | Notes |
|----------|-------|-------|
| `SESSION_SECRET` | Random 32+ chars | CRITICAL - generate new for each deployment |
| `CORS_ORIGINS` | yourdomain.com | Match your deployment domain |
| `NODE_ENV` | production | Always "production" |
| `PORT` | 3000 | Internal port (don't change) |
| `DATA_DIR` | /data | Database & upload location |

---

## Docker Compose Setup (Recommended)

### Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  brancher:
    image: brancher:latest
    container_name: brancher-prod
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      SESSION_SECRET: ${SESSION_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
    volumes:
      - brancher-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  brancher-data:
```

### Create `.env.production`
```
SESSION_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3
CORS_ORIGINS=yourdomain.com
```

### Deploy with Compose
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## Common Commands Reference

### Image Management
```bash
# Build image
docker build -t brancher:latest .

# List images
docker images | grep brancher

# Remove image
docker rmi brancher:latest

# Inspect image
docker image inspect brancher:latest
```

### Container Management
```bash
# Run container
docker run -d --name brancher -p 3000:3000 -e SESSION_SECRET="..." brancher:latest

# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop brancher

# Start stopped container
docker start brancher

# Remove container
docker rm brancher

# Restart container
docker restart brancher
```

### Container Inspection
```bash
# View logs (real-time)
docker logs -f brancher

# Get container details
docker inspect brancher

# Check resource usage
docker stats brancher

# Access container shell
docker exec -it brancher sh
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect brancher-data

# Remove volume
docker volume rm brancher-data

# Backup volume
docker run --rm -v brancher-data:/data -v $(pwd):/backup alpine tar czf /backup/volume-backup.tar.gz /data
```

### Cleanup
```bash
# Stop and remove all containers
docker stop $(docker ps -q)
docker rm $(docker ps -aq)

# Remove all unused volumes
docker volume prune

# Remove all unused images
docker image prune

# Full cleanup (CAREFUL!)
docker system prune -a --volumes
```

---

## Troubleshooting Quick Fixes

### Docker Daemon Not Running
```powershell
# Start Docker Desktop
Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker.exe"

# Wait 2-3 minutes, then verify:
docker ps
```

### Port 3000 Already in Use
```bash
# Find what's using it
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port in run command
docker run -p 8080:3000 brancher:latest
```

### Container Won't Start
```bash
# Check logs
docker logs brancher

# Common fixes:
# - Set SESSION_SECRET: -e SESSION_SECRET="..."
# - Check file permissions
# - Verify volume mount
# - Check disk space
```

### Volume Permission Issues
```bash
# Fix ownership
docker exec brancher chown -R nodejs:nodejs /data

# Or recreate volume
docker volume rm brancher-data
docker volume create brancher-data
```

### Test Container Quickly
```bash
docker run -it --rm \
  -e SESSION_SECRET="test" \
  -p 3000:3000 \
  brancher:latest
```

---

## Health Check & Verification

### Health Endpoint
```bash
# Internal (from host)
curl http://localhost:3000/api/health

# From container
docker exec brancher curl http://localhost:3000/api/health

# Expected response (200 OK)
# {"status":"ok","uptime":12345}
```

### Container Health
```bash
# Check if running
docker ps | grep brancher

# View resource usage
docker stats brancher

# Check logs for errors
docker logs brancher | grep -i error

# Inspect full details
docker inspect brancher
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Docker installed and running
- [ ] Production build completed (`client/dist/` created)
- [ ] `.env` file NOT in repository
- [ ] Session secret generated (32+ random chars)
- [ ] Domain/CORS configured

### Deployment
- [ ] Docker image built successfully
- [ ] Image size < 500 MB
- [ ] All tests passing (run `DOCKER-BUILD-TEST.ps1`)
- [ ] Container starts without errors
- [ ] Health endpoint responds
- [ ] Volume mount working

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test application functionality
- [ ] Verify data persistence (restart container)
- [ ] Check security (non-root user)
- [ ] Set up monitoring/alerting
- [ ] Document deployment details

---

## Performance Tuning

### Resource Limits
```bash
docker run -d \
  --memory 512m \
  --memory-swap 1g \
  --cpus 1 \
  -p 3000:3000 \
  brancher:latest
```

### Logging Configuration
```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 3000:3000 \
  brancher:latest
```

---

## Security Checklist

### Essential
- [ ] Non-root user running (nodejs:1001)
- [ ] SESSION_SECRET is random & strong
- [ ] .env not in image
- [ ] HTTPS/TLS at reverse proxy
- [ ] CORS configured for your domain

### Recommended
- [ ] Regular security updates
- [ ] Monitor container logs
- [ ] Backup database regularly
- [ ] Security scanning (trivy, snyk)
- [ ] Rate limiting enabled

---

## Getting Help

### Check Logs
```bash
# Real-time logs
docker logs -f brancher

# Last 50 lines
docker logs --tail 50 brancher

# Since 5 minutes ago
docker logs --since 5m brancher
```

### Automated Test Script
```bash
# Comprehensive validation
.\DOCKER-BUILD-TEST.ps1

# Custom session secret
.\DOCKER-BUILD-TEST.ps1 -SessionSecret "your-custom-secret"

# Different port
.\DOCKER-BUILD-TEST.ps1 -Port 8080
```

### Full Documentation
- `PRODUCTION-BUILD-REPORT.md` - Build details
- `DEPLOYMENT-GUIDE.md` - Complete manual
- `DOCKER-DEPLOYMENT-SUMMARY.md` - Full summary

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Build image | `docker build -t brancher:latest .` |
| Run container | `docker run -d -p 3000:3000 -e SESSION_SECRET="..." brancher:latest` |
| View logs | `docker logs -f brancher` |
| Check status | `docker ps` |
| Test health | `curl http://localhost:3000/api/health` |
| Run tests | `.\DOCKER-BUILD-TEST.ps1` |
| Stop container | `docker stop brancher` |
| Remove container | `docker rm brancher` |
| Compose up | `docker-compose up -d` |
| Compose down | `docker-compose down` |

---

**Last Updated:** 2026-10-05  
**Status:** Production Ready  
**Ready to Deploy:** Yes ✅
