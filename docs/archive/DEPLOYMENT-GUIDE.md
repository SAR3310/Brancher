# Brancher - Deployment Guide

> **ARSIP — belum terverifikasi.** Panduan ini ditulis sebelum bug backend (crash saat start, kontrak login) diperbaiki. Bagian Kubernetes **tidak ada manifest-nya di repo**. Status "Production Ready" di sini tidak dapat dipercaya. Panduan aktif: `docs/DEPLOYMENT.md`.

**Version:** 0.1.0  
**Status:** Production Ready  
**Last Updated:** 2026-10-05

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Variables](#environment-variables)
4. [Docker Deployment](#docker-deployment)
5. [Docker Compose Setup](#docker-compose-setup)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Platform-Specific Guides](#platform-specific-guides)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Overview

**Brancher** is a community-based platform application built with:
- **Frontend:** React 18 with Vite (optimized production build)
- **Backend:** Express.js with Socket.IO for real-time features
- **Database:** SQLite (persisted to `/data` volume)
- **Container:** Docker with Alpine Linux + Node 22 LTS

### Key Features
- User authentication with bcryptjs
- Real-time communication via Socket.IO
- File uploads with multer
- Session management with express-session
- Rate limiting and security headers
- Winston logging
- Zod validation

### Production Build Stats
- Client JS: 212.42 KB (68.05 KB gzipped)
- Client CSS: 15.54 KB (3.40 KB gzipped)
- Total: ~228 KB uncompressed, ~71.65 KB gzipped
- Build time: <5 seconds

---

## Pre-Deployment Checklist

### ✅ Code & Build
- [ ] Production build completed: `npm run build`
- [ ] Build artifacts verified in `client/dist/`
- [ ] No dev dependencies in production
- [ ] All assets minified and optimized
- [ ] Git branch clean or changes committed

### ✅ Environment Setup
- [ ] SESSION_SECRET generated (random 32+ characters)
- [ ] CORS_ORIGINS configured for your domain
- [ ] DATABASE location configured (defaults to /data)
- [ ] UPLOAD directory permissions verified
- [ ] .env file NOT in repository

### ✅ Docker Image
- [ ] Docker image built: `docker build -t brancher:latest .`
- [ ] Image size < 500MB
- [ ] Image runs as non-root user (nodejs)
- [ ] Volume mounts configured (/data)

### ✅ Testing
- [ ] Container starts successfully
- [ ] Health check passes
- [ ] API endpoints respond correctly
- [ ] WebSocket connections work
- [ ] File uploads function properly
- [ ] Database persists across restarts
- [ ] Logs are properly formatted

### ✅ Security
- [ ] No sensitive data in Docker image
- [ ] No .env file in repository
- [ ] SESSION_SECRET is strong and random
- [ ] CORS properly configured
- [ ] HTTPS/TLS enabled at reverse proxy
- [ ] Security headers configured

---

## Environment Variables

### Required Variables

#### `SESSION_SECRET` (CRITICAL)
- **Type:** String
- **Default:** None (must be set)
- **Length:** Minimum 32 characters, randomly generated
- **Purpose:** Encrypts session cookies
- **Example:** `SESSION_SECRET="aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV"`

Generate with:
```bash
# macOS/Linux
openssl rand -base64 32

# PowerShell Windows
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Recommended Variables

#### `PORT`
- **Type:** Number
- **Default:** 3000
- **Purpose:** Port for HTTP server
- **Example:** `PORT=3000`

#### `DATA_DIR`
- **Type:** Path
- **Default:** `/data`
- **Purpose:** Directory for SQLite database and uploads
- **Example:** `DATA_DIR=/data`

#### `NODE_ENV`
- **Type:** Enum
- **Default:** `production` (in Dockerfile)
- **Options:** `production`, `development`
- **Example:** `NODE_ENV=production`

#### `CORS_ORIGINS`
- **Type:** Comma-separated URLs
- **Default:** `localhost`
- **Purpose:** Allowed origins for CORS
- **Example:** `CORS_ORIGINS="https://brancher.com,https://app.brancher.com"`

### Optional Variables

#### `RATE_LIMIT_WINDOW`
- **Type:** Number (milliseconds)
- **Default:** 900000 (15 minutes)
- **Purpose:** Time window for rate limiting

#### `RATE_LIMIT_MAX`
- **Type:** Number
- **Default:** 100
- **Purpose:** Max requests per window

#### `UPLOAD_MAX_SIZE`
- **Type:** Number (bytes)
- **Default:** 10485760 (10 MB)
- **Purpose:** Maximum file upload size

---

## Docker Deployment

### Build the Image

```bash
cd /path/to/brancher
docker build -t brancher:latest .
```

**Expected Output:**
- Image size: 300-400 MB
- Build time: 2-5 minutes
- Base: node:22-alpine
- Status: Successfully tagged brancher:latest

### Run Single Container

#### Basic Command
```bash
docker run -d \
  --name brancher \
  -p 3000:3000 \
  -e SESSION_SECRET="your-secure-secret-here" \
  -v brancher-data:/data \
  brancher:latest
```

#### Full Production Command
```bash
docker run -d \
  --name brancher-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e CORS_ORIGINS="https://yourdomain.com" \
  -e PORT=3000 \
  -e DATA_DIR=/data \
  -v brancher-data:/data \
  --restart unless-stopped \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  brancher:latest
```

### Verify Container

```bash
# Check if running
docker ps | grep brancher

# View logs
docker logs brancher-prod

# Follow logs in real-time
docker logs -f brancher-prod

# Check resource usage
docker stats brancher-prod

# Access container shell
docker exec -it brancher-prod sh
```

### Health Check

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "ok",
#   "uptime": 123456
# }
```

### Stop & Cleanup

```bash
# Stop container
docker stop brancher-prod

# Remove container
docker rm brancher-prod

# Remove volume (data loss!)
docker volume rm brancher-data

# Remove image
docker rmi brancher:latest
```

---

## Docker Compose Setup

### Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  brancher:
    image: brancher:latest
    container_name: brancher-prod
    restart: unless-stopped
    
    # Ports
    ports:
      - "3000:3000"
    
    # Environment Variables
    environment:
      NODE_ENV: production
      PORT: 3000
      DATA_DIR: /data
      SESSION_SECRET: ${SESSION_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS:-localhost}
    
    # Volumes
    volumes:
      - brancher-data:/data
      - /etc/localtime:/etc/localtime:ro  # Timezone sync
    
    # Logging
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: 3
    
    # Health Check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    # Resource Limits (optional)
    # deploy:
    #   resources:
    #     limits:
    #       cpus: '1'
    #       memory: 512M
    #     reservations:
    #       cpus: '0.5'
    #       memory: 256M

volumes:
  brancher-data:
    driver: local
```

### Environment File

Create `.env.production`:

```bash
# Session Security (MUST be unique for each deployment)
SESSION_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Optional customizations
# PORT=3000
# DATA_DIR=/data
```

### Launch with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f brancher

# Stop services
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Docker image pushed to registry

### Push Image to Registry

```bash
# Tag image
docker tag brancher:latest myregistry/brancher:latest

# Push to registry
docker push myregistry/brancher:latest
```

### Kubernetes Resources

#### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: brancher
```

#### Secret for Session Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: brancher-secrets
  namespace: brancher
type: Opaque
stringData:
  session-secret: "your-secure-random-secret-here"
```

#### PersistentVolumeClaim
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: brancher-data
  namespace: brancher
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: brancher
  namespace: brancher
  labels:
    app: brancher
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: brancher
  template:
    metadata:
      labels:
        app: brancher
    spec:
      # Security Context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      
      containers:
      - name: brancher
        image: myregistry/brancher:latest
        imagePullPolicy: IfNotPresent
        
        # Ports
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        
        # Environment Variables
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATA_DIR
          value: "/data"
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: brancher-secrets
              key: session-secret
        - name: CORS_ORIGINS
          value: "https://yourdomain.com"
        
        # Volume Mounts
        volumeMounts:
        - name: data
          mountPath: /data
        
        # Resource Requests & Limits
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        
        # Startup Probe
        startupProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30
        
        # Liveness Probe
        livenessProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness Probe
        readinessProbe:
          httpGet:
            path: /api/health
            port: http
          initialDelaySeconds: 15
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        # Security Context (container-level)
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false
          capabilities:
            drop:
              - ALL
      
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: brancher-data
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: brancher
  namespace: brancher
spec:
  type: ClusterIP
  selector:
    app: brancher
  ports:
  - name: http
    port: 80
    targetPort: http
    protocol: TCP
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: brancher
  namespace: brancher
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    secretName: brancher-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: brancher
            port:
              name: http
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace brancher

# Create secret
kubectl apply -f secret.yaml

# Create PVC
kubectl apply -f pvc.yaml

# Create deployment
kubectl apply -f deployment.yaml

# Create service
kubectl apply -f service.yaml

# Create ingress
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get pods -n brancher
kubectl get svc -n brancher
kubectl get ingress -n brancher

# View logs
kubectl logs -f deployment/brancher -n brancher

# Scale replicas
kubectl scale deployment brancher --replicas=3 -n brancher
```

---

## Platform-Specific Guides

### Railway.app

1. **Connect GitHub Repository**
   - Go to railway.app
   - Create new project
   - Select GitHub repo: brancher

2. **Configure Environment**
   ```
   SESSION_SECRET=<generate-random>
   CORS_ORIGINS=yourdomain.railway.app
   NODE_ENV=production
   ```

3. **Add PostgreSQL (Optional)**
   - Add service → PostgreSQL
   - Link to app

4. **Deploy**
   - Railway auto-deploys on git push
   - Monitor in railway.app dashboard

### Render.com

1. **Create New Service**
   - Service type: Web Service
   - Build command: `npm run build`
   - Start command: `node server/index.js`

2. **Environment Variables**
   ```
   SESSION_SECRET=<generate-random>
   CORS_ORIGINS=*.onrender.com
   NODE_ENV=production
   ```

3. **Add Persistent Disk**
   - Mount path: `/data`
   - Size: 5+ GB

4. **Deploy**
   - Render auto-deploys on git push

### Fly.io

```bash
# Install flyctl
brew install flyctl  # or download from fly.io

# Login
flyctl auth login

# Initialize app
flyctl launch --dockerfile

# Configure in fly.toml
[[services]]
  internal_port = 3000
  protocol = "tcp"
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [[services.ports]]
    port = 80
    handlers = ["http"]

# Set environment variables
flyctl secrets set SESSION_SECRET=<random>
flyctl secrets set CORS_ORIGINS=yourdomain.fly.dev

# Add persistent volume
flyctl volumes create data --size 10

# Deploy
flyctl deploy
```

### DigitalOcean App Platform

1. **Create App**
   - Source: GitHub
   - Select brancher repo
   - Build: Automatic (Dockerfile)

2. **Configure**
   - Instance size: Basic ($12/month)
   - Environment variables in UI

3. **Deploy**
   - Click Deploy
   - Monitor in dashboard

### Traditional VPS (AWS EC2, Linode, etc.)

1. **Connect via SSH**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourname/brancher.git
   cd brancher
   ```

4. **Create .env File**
   ```bash
   echo "SESSION_SECRET=$(openssl rand -base64 32)" > .env
   echo "CORS_ORIGINS=yourdomain.com" >> .env
   ```

5. **Build and Deploy**
   ```bash
   docker-compose up -d
   ```

6. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Monitoring & Logging

### Winston Logger

Brancher uses Winston for logging. Logs are written to:
- Console (development)
- Files (production)

### View Docker Logs

```bash
# Real-time logs
docker logs -f brancher-prod

# Last 100 lines
docker logs --tail 100 brancher-prod

# Logs since 10 minutes ago
docker logs --since 10m brancher-prod

# Structured logs (JSON)
docker logs brancher-prod --format json-file
```

### Performance Monitoring

```bash
# CPU & Memory usage
docker stats brancher-prod

# Network I/O
docker stats --no-stream brancher-prod

# Inspect container
docker inspect brancher-prod
```

### Health Check

```bash
# Internal health endpoint
curl http://localhost:3000/api/health

# From outside container
docker exec brancher-prod curl http://localhost:3000/api/health

# Kubernetes health
kubectl get pods -n brancher
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs brancher-prod

# Common issues:
# - SESSION_SECRET not set
# - PORT already in use
# - /data directory not writable
# - Corrupted database
```

### Port Already in Use

```bash
# Find what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # macOS/Linux

# Use different port
docker run -p 8080:3000 brancher:latest
```

### Volume Permission Denied

```bash
# Check volume permissions
docker exec brancher-prod ls -la /data

# Fix permissions
docker exec brancher-prod chown -R nodejs:nodejs /data
```

### Database Corruption

```bash
# Backup existing data
docker cp brancher-prod:/data ./data-backup

# Stop container
docker stop brancher-prod

# Remove old volume
docker volume rm brancher-data

# Restart (fresh database)
docker start brancher-prod
```

### WebSocket Connection Issues

Check CORS_ORIGINS and ensure it matches your domain exactly (including protocol and port).

### Out of Memory

```bash
# Increase Docker memory limit
docker run -m 1g brancher:latest

# Or in docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
```

---

## Security Best Practices

### 1. Secrets Management

✅ **DO:**
- Generate strong SESSION_SECRET (32+ chars)
- Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Never commit .env to git

❌ **DON'T:**
- Hardcode secrets in code
- Use weak/predictable secrets
- Commit .env files
- Share secrets in logs

### 2. Network Security

✅ **DO:**
- Use HTTPS/TLS for all connections
- Configure CORS properly
- Use reverse proxy (Nginx, Caddy)
- Enable firewall rules
- Use rate limiting

❌ **DON'T:**
- Expose container ports directly
- Allow all CORS origins
- Disable TLS
- Run on port 80 without HTTPS redirect

### 3. Container Security

✅ **DO:**
- Run as non-root user (nodejs:1001)
- Use Alpine Linux (minimal surface)
- Read-only filesystem where possible
- Drop unnecessary capabilities
- Use security context

❌ **DON'T:**
- Run as root
- Include secrets in image
- Use latest tag in production
- Mount Docker socket
- Run privileged containers

### 4. Data Protection

✅ **DO:**
- Enable database backups
- Use encrypted volumes
- Set up monitoring
- Log access and errors
- Regular security audits

❌ **DON'T:**
- Store unencrypted sensitive data
- Skip backups
- Ignore security warnings
- Disable logging

### 5. Dependency Management

✅ **DO:**
- Run `npm audit` regularly
- Update dependencies monthly
- Use npm audit fix
- Pin versions in production
- Monitor for CVEs

❌ **DON'T:**
- Ignore audit warnings
- Use outdated dependencies
- Update all dependencies at once
- Use development versions in production

---

## Support & Resources

- **Documentation:** See README.md
- **Issues:** Report on GitHub
- **Security:** Report via GitHub Security Advisory
- **Community:** Join our Discord/Telegram

---

**Deployment Status:** Ready for Production  
**Last Verified:** 2026-10-05  
**Recommended Node Version:** 22 LTS  
**Recommended OS:** Linux (Ubuntu 22.04 LTS)
