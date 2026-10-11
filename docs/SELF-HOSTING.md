# Brancher - Self-Hosting Guide

**Version**: 1.0  
**Last Updated**: 2026-10-07  
**Target Audience**: Sekolah, organisasi, komunitas yang mau host Brancher sendiri

---

## 🎯 Tujuan

Panduan ini membantu kamu menginstall dan menjalankan Brancher di server/komputer milik kamu. Setelah selesai:
- ✅ Brancher berjalan di domain kamu (mis: `brancher.sekolah.sch.id`)
- ✅ Data aman (backup otomatis)
- ✅ User bisa login dan chat
- ✅ HTTPS (encrypted traffic)

**Waktu**: 30-60 menit (pertama kali)

---

## 📋 Prerequisites (Apa yang Diperlukan)

### Pilihan 1: Linux Server (Recommended)
- **OS**: Ubuntu 22.04 LTS (atau Debian 12)
- **Resources**: 
  - CPU: 2 cores
  - RAM: 2GB minimum (4GB recommended)
  - Disk: 20GB (untuk SQLite + uploads)
- **Network**: Static IP atau domain yang sudah point ke server
- **Software** yang perlu diinstall:
  - Node.js 22+
  - npm 10+
  - nginx (reverse proxy)
  - sqlite3 (untuk backup)

### Pilihan 2: Windows Server (Self-Hosted)
- **OS**: Windows Server 2019+ atau Windows 10/11 Pro
- **Resources**: Same as Linux
- **Network**: Static IP atau domain
- **Software**:
  - Node.js 22+ (installer dari nodejs.org)
  - npm (included dengan Node.js)
  - IIS atau nginx (reverse proxy)

### Pilihan 3: Docker (Advanced)
- **OS**: Any (Windows, Linux, Mac)
- **Software**: Docker + Docker Compose
- **Benefit**: No dependency hell, easy to upgrade

---

## 🚀 Installation

### **Setup 1: Linux (Ubuntu 22.04)**

#### Step 1: SSH ke server

```bash
ssh admin@your-server-ip
# atau kalau pake hostname: ssh admin@brancher.sekolah.sch.id
```

#### Step 2: Update sistem

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential sqlite3
```

#### Step 3: Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:
```bash
node --version  # v22.x.x
npm --version   # 10.x.x
```

#### Step 4: Clone / Download Brancher

```bash
# Pilihan A: Clone dari GitHub (kalau sudah publik)
cd /opt
sudo git clone https://github.com/yourusername/brancher.git
cd brancher

# Pilihan B: Upload file ZIP
# 1. Download brancher.zip dari desktop
# 2. Upload ke server: scp brancher.zip admin@server:/opt/
# 3. Extract: unzip /opt/brancher.zip
```

#### Step 5: Setup Brancher

```bash
cd /opt/brancher

# Install dependencies
npm install

# Buat folder data (untuk SQLite database)
sudo mkdir -p /srv/brancher/data
sudo chown -R $USER:$USER /srv/brancher/data

# Copy .env.production.example ke .env
cp .env.production.example .env

# Edit .env dengan editor favorit (nano, vim, atau VS Code remote)
nano .env
```

Di `.env`, ubah:
```ini
# Copy .env.production.example, ubah:
SESSION_SECRET=<GENERATE_RANDOM_STRING>  # lihat step 6
CORS_ORIGINS=https://brancher.sekolah.sch.id
DATA_DIR=/srv/brancher/data
NODE_ENV=production
LOG_LEVEL=warn
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 1a2b3c4d5e6f... (copy ini ke SESSION_SECRET)
```

#### Step 6: Build client

```bash
npm run build
# Ini compile React → static files di client/dist/
```

#### Step 7: Start Brancher (test mode)

```bash
npm start
```

Kalau lihat:
```
Server running on http://localhost:3000
```

✅ Berhasil! Ctrl+C untuk stop.

#### Step 8: Setup Systemd Service (auto-start)

Agar Brancher jalan otomatis saat server restart:

```bash
sudo nano /etc/systemd/system/brancher.service
```

Copy-paste:
```ini
[Unit]
Description=Brancher Chat Platform
After=network.target

[Service]
Type=simple
User=brancher
WorkingDirectory=/opt/brancher
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PATH=/opt/brancher/node_modules/.bin:/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

Aktifkan:
```bash
sudo systemctl daemon-reload
sudo systemctl enable brancher
sudo systemctl start brancher
sudo systemctl status brancher  # Cek status
```

Lihat logs:
```bash
sudo journalctl -u brancher -f  # Live logs
```

#### Step 9: Setup Nginx (Reverse Proxy)

Nginx handle HTTPS + forward traffic ke port 3000.

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/brancher
```

Copy-paste:
```nginx
upstream brancher_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name brancher.sekolah.sch.id;

    # Redirect ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name brancher.sekolah.sch.id;

    # SSL Certificates (setup di step 10)
    ssl_certificate /etc/letsencrypt/live/brancher.sekolah.sch.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brancher.sekolah.sch.id/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy ke Brancher backend
    location / {
        proxy_pass http://brancher_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|gif|ico|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/brancher /etc/nginx/sites-enabled/
sudo nginx -t  # Check syntax
sudo systemctl restart nginx
```

#### Step 10: Setup SSL/HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d brancher.sekolah.sch.id
```

Follow prompts. Sertifikat otomatis diperpanjang.

Verify nginx config:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 11: Verify Installation

```bash
# Test HTTPS
curl https://brancher.sekolah.sch.id/api/health

# Kalau output:
# {"status":"ok","timestamp":"...","uptime":...}
# ✅ Berhasil!
```

Buka browser: `https://brancher.sekolah.sch.id`

---

### **Setup 2: Windows (Self-Hosted)**

#### Step 1: Download Node.js

- Ke https://nodejs.org/
- Download LTS (22.x)
- Install (default settings OK)
- Restart Command Prompt / PowerShell

Verifikasi:
```powershell
node --version
npm --version
```

#### Step 2: Download Brancher

```powershell
# Option A: Git clone
git clone https://github.com/yourusername/brancher.git
cd brancher

# Option B: Unzip brancher.zip
```

#### Step 3: Install & Setup

```powershell
# Install dependencies
npm install

# Create data folder
mkdir C:\brancher\data
mkdir C:\brancher\logs

# Copy .env
copy .env.production.example .env

# Edit .env (gunakan VS Code atau Notepad++)
# SESSION_SECRET=<RANDOM>
# CORS_ORIGINS=https://brancher.sekolah.sch.id
# DATA_DIR=C:\brancher\data
# NODE_ENV=production
```

#### Step 4: Build

```powershell
npm run build
```

#### Step 5: Test Run

```powershell
npm start
```

Akses: `http://localhost:3000`

Kalau OK, Ctrl+C stop.

#### Step 6: Auto-Start dengan Task Scheduler

**Create batch file** `C:\brancher\start-brancher.bat`:
```batch
@echo off
cd C:\brancher
node server/index.js
```

**Create Task Scheduler entry:**
1. Buka Task Scheduler
2. Right-click "Task Scheduler Library" → "Create Task..."
3. Name: "Brancher Auto-Start"
4. Check "Run with highest privileges"
5. Trigger: "At startup"
6. Action: "Start a program"
   - Program: `C:\brancher\start-brancher.bat`
   - Start in: `C:\brancher`
7. OK

#### Step 7: Setup Reverse Proxy (IIS atau nginx)

**Option A: Nginx for Windows**
- Download nginx: https://nginx.org/en/download.html
- Extract ke `C:\nginx`
- Edit `conf/nginx.conf` (similar to Linux, tapi path Windows)
- Jalankan `nginx.exe`

**Option B: IIS (built-in Windows)**
1. Buka "Add Roles and Features"
2. Install IIS + Application Request Routing (ARR)
3. Setup reverse proxy rule → `http://localhost:3000`

#### Step 8: SSL/HTTPS

**Option A: Let's Encrypt (free)**
- Pakai Certbot for Windows: https://certbot.eff.org/instructions?ws=iis&os=windows
- Auto-renewal

**Option B: Self-signed (testing only)**
```powershell
# Untuk testing:
# powershell -Command "New-SelfSignedCertificate ..."
```

---

## 🔄 Regular Maintenance

### Daily Backup (Automated)

#### Linux Backup Script

Create `backup-brancher.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/srv/brancher/backups"
DB_FILE="/srv/brancher/data/brancher.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
sqlite3 $DB_FILE ".backup $BACKUP_DIR/backup_${TIMESTAMP}.db"
gzip $BACKUP_DIR/backup_${TIMESTAMP}.db

# Keep only 7 latest backups
find $BACKUP_DIR -name "backup_*.db.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_${TIMESTAMP}.db.gz"
```

Add to cron:
```bash
sudo crontab -e

# Add: 0 2 * * * /opt/brancher/backup-brancher.sh
# (Run at 2 AM daily)
```

#### Windows Backup (Task Scheduler)

Create script `backup-brancher.ps1`:
```powershell
$BackupDir = "C:\brancher\backups"
$DbFile = "C:\brancher\data\brancher.db"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Copy-Item $DbFile "$BackupDir\backup_$Timestamp.db"
Get-ChildItem "$BackupDir\*.db" -Recurse | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) } | Remove-Item
```

Schedule in Task Scheduler.

### Check Health

```bash
# Get status endpoint
curl https://brancher.sekolah.sch.id/api/health
```

Expected output:
```json
{
  "status": "ok",
  "timestamp": "2026-10-07T10:30:00Z",
  "uptime": 86400,
  "memory": { "heapUsed": 50000000, "heapTotal": 100000000 },
  "activeUsers": 25
}
```

### Monitor Logs

```bash
# Linux
sudo journalctl -u brancher -n 50  # Last 50 lines

# Windows
Get-Content C:\brancher\logs\app.log -Tail 50
```

---

## 🛠️ Troubleshooting

### Problem: "Connection refused" (Server tidak bisa diakses)

**Check:**
```bash
# Apakah Brancher running?
sudo systemctl status brancher  # Linux
tasklist | findstr node         # Windows

# Apakah port 3000 terbuka?
sudo netstat -tlnp | grep 3000  # Linux
netstat -ano | findstr 3000     # Windows

# Apakah nginx/reverse proxy running?
sudo systemctl status nginx
```

**Fix:**
```bash
# Restart Brancher
sudo systemctl restart brancher

# Restart nginx
sudo systemctl restart nginx
```

### Problem: "SSL Certificate Error"

**Check:**
```bash
# Apakah sertifikat valid?
sudo certbot certificates
```

**Fix:**
```bash
# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

### Problem: "Database Locked" (saat startup)

**Cause:** Previous instance belum fully shutdown.

**Fix:**
```bash
# Kill lingering process
pkill -f "node server/index.js"

# Restart
sudo systemctl start brancher
```

### Problem: "Out of Memory"

**Check RAM usage:**
```bash
# Linux
free -h
top -p $(pgrep -f "node server/index.js")

# Windows
tasklist /v | findstr node
```

**Fix:**
- Restart Brancher (temporary)
- Upgrade RAM (permanent)
- Consider PostgreSQL migration (long-term)

---

## 📊 Monitoring & Metrics

### Simple Uptime Monitoring

Use Uptime Robot (free):
1. Buka https://uptimerobot.com/
2. Add monitor: `https://brancher.sekolah.sch.id/api/health`
3. Alert via email kalau down

### Check Active Users

```bash
# Via database
sqlite3 /srv/brancher/data/brancher.db "SELECT COUNT(*) FROM memberships;"

# Via API health endpoint
curl https://brancher.sekolah.sch.id/api/health | jq .activeUsers
```

---

## 🔐 Security Checklist

- ✅ `.env` file permission 600 (hanya owner baca)
- ✅ `SESSION_SECRET` di-generate random (bukan example)
- ✅ HTTPS/SSL enabled (bukan HTTP)
- ✅ CORS_ORIGINS sesuai domain kamu (bukan *wildcard*)
- ✅ Firewall: only allow port 80, 443 (close 3000)
- ✅ Regular backups ke external disk / cloud
- ✅ Log rotation enabled
- ✅ Database access hanya dari localhost (bukan exposed)

---

## 📈 Next Steps

### Upgrade ke PostgreSQL (1000+ users)

SQLite bisa handle ~500 concurrent users. Kalau lebih:
1. Backup SQLite database
2. Migrate ke PostgreSQL
3. Update connection string di `.env`

Lihat: `docs/MIGRATION-POSTGRESQL.md` — *belum ditulis; direncanakan.*

### Upgrade ke Multi-Instance (High Availability)

Deploy 2+ instances + load balancer:
1. PostgreSQL + Redis (shared)
2. 2x Brancher instances
3. nginx load balancer

Lihat: `docs/DEPLOYMENT-HA.md` — *belum ditulis; direncanakan.*

---

## 📞 Support & Issues

- **Bug/Feature requests**: GitHub Issues
- **Questions**: Community forum / Discord
- **Security issues**: Email security@brancher.dev (responsible disclosure)

---

**Good luck! 🚀**
