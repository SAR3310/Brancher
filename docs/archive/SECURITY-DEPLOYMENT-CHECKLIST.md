# Brancher Security Deployment Checklist

> **ARSIP — belum terverifikasi.** Dokumen ini adalah catatan sesi kerja lama. Klaim seperti "production ready", "100%", atau "Stability ✅" di dalamnya **tidak dapat dipercaya**: beberapa bug (backend crash saat start, login gagal karena kontrak field API `identifier` vs `email`) lolos dari laporan-laporan ini. Klaim soal Docker build juga kemungkinan tidak pernah diverifikasi sungguhan — header laporan ini sendiri menyebut "DOCKER BUILD PENDING". Lihat `CHANGELOG.md` untuk status terkini. Dokumen ini hanya disimpan sebagai riwayat.

## Pre-Production Security Verification

**Version**: 1.0  
**Date**: 2026-10-05  
**Estimated Time**: 15-20 minutes  

---

## CRITICAL - MUST COMPLETE BEFORE DEPLOYMENT

### 🔐 Environment Variables
- [ ] `SESSION_SECRET` - Set to random 32+ character string
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `NODE_ENV=production` - Enforce production mode
- [ ] `CORS_ORIGINS=https://your-domain.com` - Set production domain
- [ ] `DATA_DIR=/data` - Point to persistent volume
- [ ] No secrets in `.env` file committed to git

### 🔒 HTTPS & TLS
- [ ] SSL certificate installed and valid
- [ ] TLS 1.2+ enforced (disable TLS 1.0, 1.1)
- [ ] Certificate auto-renewal configured
- [ ] HTTPS redirects HTTP connections

### 🗄️ Database
- [ ] Database backed up
- [ ] Backup location is secure
- [ ] Restore procedure tested
- [ ] SQLite WAL mode: `PRAGMA journal_mode`
  ```sql
  -- Test in sqlite3 shell:
  PRAGMA journal_mode=WAL;
  PRAGMA journal_mode; -- Should return 'wal'
  ```
- [ ] Database file permissions: `0600` (owner only)

### 📊 Monitoring & Logging
- [ ] Log aggregation configured (ELK, Datadog, etc.)
- [ ] Error tracking enabled (Sentry or alternative)
- [ ] Alert rules configured for:
  - [ ] Failed login attempts (spike)
  - [ ] Rate limit exceeded
  - [ ] Unauthorized access attempts
  - [ ] Application errors

---

## HIGH - STRONGLY RECOMMENDED

### 🛡️ Security Headers Verification
```bash
curl -I https://your-domain.com/api/me
```
Verify these headers present:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy: default-src 'self'; ...`
- [ ] `Strict-Transport-Security: max-age=31536000; ...`
- [ ] `Cache-Control: no-store`

### 🌐 CORS Configuration
- [ ] Test CORS with curl:
  ```bash
  curl -H "Origin: https://your-domain.com" \
       -H "Access-Control-Request-Method: POST" \
       -I https://your-domain.com/api/
  # Should return Access-Control headers
  
  curl -H "Origin: https://attacker.com" \
       -H "Access-Control-Request-Method: POST" \
       -I https://your-domain.com/api/
  # Should NOT return Access-Control headers
  ```
- [ ] CORS whitelist correct for production
- [ ] Development origins removed from production config

### 🐳 Docker Security
- [ ] Docker image built successfully
- [ ] Non-root user verification:
  ```bash
  docker exec <container> ps aux | grep node
  # Should show nodejs user, NOT root
  ```
- [ ] Volume mounts tested (data persistence)
- [ ] Image scanned for vulnerabilities (optional: Trivy)

### 💻 Application Testing
- [ ] Application starts without errors
- [ ] Health check endpoint responding
- [ ] User registration works
- [ ] User login works
- [ ] Sessions persist across server restarts
- [ ] File uploads work
- [ ] WebSocket connections stable

---

## MEDIUM - IMPORTANT FOR SECURITY

### 🔑 Rate Limiting Verification
```bash
# Test rate limiting (should block at 101 requests/minute)
for i in {1..105}; do
  curl http://localhost:3000/api/ &
done
# Should see 429 Too Many Requests at request 101+
```
- [ ] Global rate limiter active (100/min per IP)
- [ ] Auth limiter active (30/15min)
- [ ] Message rate limiting tested

### 🔍 Input Validation Testing
```bash
# Test XSS prevention (should be blocked)
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>","channelId":1}'
# Should get 401 or 400 error
```
- [ ] XSS attempts blocked
- [ ] SQL injection attempts blocked
- [ ] File uploads validated (MIME type, size)

### 📝 Secrets Management
- [ ] No passwords in application code
- [ ] No API keys in git history
  ```bash
  git log --all --oneline | wc -l
  # Check commits for exposed secrets
  ```
- [ ] Secrets stored in secure vault
- [ ] Environment variables loaded safely

### 🚀 Network Security
- [ ] Firewall rules configured
  - [ ] Only ports 80, 443 open
  - [ ] SSH access restricted to admin IPs
- [ ] DDoS protection enabled (Cloudflare, AWS Shield)
- [ ] Rate limiting on reverse proxy (if applicable)

---

## LOW - NICE TO HAVE

### 📊 Performance & Stability
- [ ] Application uptime > 99%
- [ ] Response times < 500ms (p95)
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### 🔔 Alerting Configuration
- [ ] Slack/email alerts configured for:
  - [ ] Application errors
  - [ ] Security events
  - [ ] Uptime issues

### 📚 Documentation
- [ ] Security documentation reviewed
- [ ] Team training completed
- [ ] Incident response plan communicated

---

## SECURITY HEADERS REFERENCE

### What Each Header Does

| Header | Purpose | Value |
|--------|---------|-------|
| X-Frame-Options | Prevent clickjacking | DENY |
| X-Content-Type-Options | Prevent MIME sniffing | nosniff |
| X-XSS-Protection | Legacy XSS protection | 1; mode=block |
| Content-Security-Policy | XSS & injection prevention | default-src 'self'; ... |
| Strict-Transport-Security | Force HTTPS | max-age=31536000; ... |
| Referrer-Policy | Control referrer leaking | strict-origin-when-cross-origin |
| Permissions-Policy | Disable browser features | geolocation=(), ... |
| Cache-Control | Prevent caching secrets | no-store |

---

## COMMON ISSUES & SOLUTIONS

### Issue: "X-Frame-Options header missing"
**Solution**: Security headers middleware is active
```bash
# Verify in server/index.js:
grep "securityHeadersMiddleware" server/index.js
```

### Issue: "CORS blocked my request"
**Solution**: Add domain to CORS_ORIGINS environment variable
```bash
# Production: Set CORS_ORIGINS environment variable
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Issue: "Rate limit blocking legitimate traffic"
**Solution**: Adjust rate limiting in production
```bash
# In server/index.js:
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // Adjust time window
  max: 100,                 // Adjust request limit
});
```

### Issue: "Database permissions error"
**Solution**: Fix file ownership and permissions
```bash
# For Docker volume:
chmod 600 /data/db.sqlite
chown 1001:1001 /data/db.sqlite
```

---

## VERIFICATION COMMANDS

### Quick Security Check
```bash
#!/bin/bash
# Run these commands to verify security

echo "=== Security Headers Check ==="
curl -I https://your-domain.com/api/me | grep -E "X-Frame|X-Content|X-XSS|Content-Security|Strict-Transport"

echo "=== Database Check ==="
sqlite3 /data/db.sqlite "PRAGMA journal_mode;"

echo "=== Process Check ==="
ps aux | grep node | grep -v root

echo "=== Certificate Check ==="
openssl s_client -connect your-domain.com:443 -showcerts | grep -A2 "Validity"

echo "=== Rate Limiting Check ==="
echo "Testing 105 requests (should block at 101)..."
for i in {1..105}; do curl -s -o /dev/null -w "%{http_code} "; done; echo ""
```

---

## POST-DEPLOYMENT VERIFICATION

### Immediate (First Hour)
- [ ] Application is responding
- [ ] No error spike in logs
- [ ] Users can login
- [ ] New user registration works
- [ ] File uploads working

### First Day
- [ ] Monitor error rates
- [ ] Check security logs
- [ ] Verify backups running
- [ ] Test health checks
- [ ] Review monitoring dashboards

### First Week
- [ ] Security audit passed
- [ ] Performance metrics stable
- [ ] No security incidents
- [ ] Team trained on procedures
- [ ] Incident response plan exercised

---

## ROLLBACK PROCEDURE

If deployment fails security checks:

1. **STOP**: Do not proceed with rollback
2. **ASSESS**: Identify specific security issue
3. **DOCUMENT**: Record the failure and root cause
4. **FIX**: Address security issue locally
5. **TEST**: Verify fix in staging environment
6. **RETRY**: Deploy again with fixes
7. **VERIFY**: Re-run entire checklist

---

## SECURITY CONTACTS

| Role | Contact | Responsibility |
|------|---------|-----------------|
| Security Lead | Kentaro | Security decisions |
| DevOps | Team | Infrastructure security |
| Development | Team | Code security |
| Emergency | on-call | 24/7 incident response |

---

## QUICK REFERENCE

### Most Critical Items (MUST DO)
1. ✅ Set SESSION_SECRET to random value
2. ✅ Set NODE_ENV=production
3. ✅ Configure CORS_ORIGINS
4. ✅ Verify security headers present
5. ✅ Test application functionality
6. ✅ Verify non-root Docker user
7. ✅ Configure monitoring/logging
8. ✅ Back up database

### Most Common Mistakes (AVOID)
1. ❌ Using default/weak SESSION_SECRET
2. ❌ Leaving CORS open to "*"
3. ❌ Running Docker as root
4. ❌ Committing secrets to git
5. ❌ Not backing up database
6. ❌ Skipping monitoring setup
7. ❌ Not testing in staging first
8. ❌ Forgetting SSL certificate renewal

---

## SIGN-OFF

| Item | Status | Date | Approver |
|------|--------|------|----------|
| Security Checklist Reviewed | ☐ | _____ | __________ |
| All Items Verified | ☐ | _____ | __________ |
| Ready for Production | ☐ | _____ | __________ |

---

**Created**: 2026-10-05  
**Last Updated**: 2026-10-05  
**Next Review**: 2026-01-05

Print this checklist and bring to deployment meeting. ✅

