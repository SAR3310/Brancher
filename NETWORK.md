# Brancher - Network Access Guide

## 🌐 Network Exposure Configuration

Aplikasi Brancher sekarang berjalan di **0.0.0.0** (semua interfaces) dan dapat diakses dari:

- Local machine
- Other devices pada same network
- Tailscale VPN
- Internet (jika di-expose)

---

## 📍 Access URLs

### **Local Machine**

```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

### **Same Network (via LAN IP)**

```
Frontend: http://192.168.10.197:5173
Backend:  http://192.168.10.197:3000
```

### **Tailscale VPN**

```
Frontend: http://100.100.1.1:5173
Backend:  http://100.100.1.1:3000
```

### **Other Devices on Network**

Replace `192.168.10.197` dengan local IP address Anda:

```
- Desktop:   http://192.168.10.197:5173
- Smartphone: http://192.168.10.197:5173
- Laptop:    http://192.168.10.197:5173
```

---

## 🔧 Configuration

### Server Listen Configuration

**File**: `server/index.js` (lines 492-499)

```javascript
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Brancher berjalan di http://0.0.0.0:${PORT}`);
});
```

### Environment Variables

**File**: `.env`

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

---

## 🚀 Using Tailscale

### Setup (if not already done)

```bash
tailscale up
```

### Access via Tailscale

1. Get your Tailscale IP:

   ```bash
   tailscale ip -4
   ```

   Output: `100.100.1.1` (example)

2. Share URL with team:

   ```
   http://100.100.1.1:5173
   ```

3. They can access if connected to same Tailscale network

---

## 📱 Mobile Testing

### From Smartphone/Tablet

1. Connect to same WiFi network
2. Open browser
3. Go to: `http://192.168.10.197:5173` (replace IP)

### Troubleshooting Mobile Access

- **Connection refused**: Check firewall
- **Can't find IP**: Run `ipconfig` on your PC
- **DNS not resolving**: Use IP instead of hostname

---

## 🔒 Security Considerations

### Current Configuration

- ✅ Listening on `0.0.0.0` (all interfaces)
- ⚠️ No TLS/HTTPS (development only)
- ⚠️ No authentication firewall

### For Production

- [ ] Use reverse proxy (nginx, Caddy)
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall rules
- [ ] Use proper authentication
- [ ] Rate limit endpoints
- [ ] Add CORS configuration if needed

### Quick Firewall Check

```powershell
# Check if port is listening
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

---

## 🌍 Public Internet Exposure

If you want to expose to internet (NOT recommended for development):

### Using Ngrok

```bash
# Install ngrok
winget install ngrok

# Expose frontend
ngrok http 5173

# Expose backend
ngrok http 3000
```

### Using Cloudflare Tunnel

```bash
# Install cloudflared
winget install cloudflare.cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create brancher

# Route domain
cloudflared tunnel route dns brancher yourdomain.com
```

**⚠️ Warning**: Only expose public-facing apps to internet. Keep development/local apps private.

---

## 🐛 Network Debugging

### Check Server is Listening

```bash
netstat -ano | findstr :3000
# Should show: LISTENING

# Get IP addresses
ipconfig /all

# Test connectivity
ping 192.168.10.197
```

### Test from Another Device

```bash
# Linux/Mac
curl http://192.168.10.197:3000/api/me

# Windows
Invoke-WebRequest -Uri "http://192.168.10.197:3000" -ErrorAction Stop
```

### Monitor Connections

```bash
# Real-time connections
netstat -ano | findstr :3000

# Active connections to your server
Get-NetTCPConnection -LocalPort 3000
```

---

## 📊 Network Architecture

```
┌─────────────────────┐
│   Your Computer     │
│  192.168.10.197     │
│                     │
│  Backend: :3000     │
│  Frontend: :5173    │
└──────────┬──────────┘
           │
    ┌──────┴────────┐
    │               │
┌───────┐      ┌────────┐
│ Same  │      │ Other  │
│LAN    │      │Networks│
│Devices│      │ (Proxy)│
└───────┘      └────────┘
    │               │
    └───────┬───────┘
            │
       ┌────────┐
       │Tailscale│
       │ 100.x.x │
       └────────┘
```

---

## ⚙️ Reverse Proxy Setup (Optional)

If you want to use a nice domain name instead of IP:

### Nginx Example

```nginx
server {
    listen 80;
    server_name brancher.local;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

Then access: `http://brancher.local`

---

## 🎯 Common Scenarios

### Scenario 1: Testing on Same Smartphone

```
1. Find your PC IP:    ipconfig → IPv4 Address
2. Enable WiFi on phone
3. Open: http://192.168.10.197:5173
```

### Scenario 2: Accessing from Remote Office (via Tailscale)

```
1. Both machines have Tailscale
2. Open: http://100.100.1.1:5173
3. Works anywhere with internet
```

### Scenario 3: Team Collaboration

```
1. Share network IP with team
2. Everyone on same WiFi can access
3. No setup needed, just open URL
```

### Scenario 4: VPN/Remote Access

```
1. Use reverse proxy (Ngrok, Cloudflare)
2. Share public URL
3. Anyone can access temporarily
```

---

## 📝 Configuration Summary

| Setting        | Value        | Purpose                  |
| -------------- | ------------ | ------------------------ |
| HOST           | 0.0.0.0      | Listen on all interfaces |
| PORT           | 3000         | Backend server port      |
| FRONTEND_PORT  | 5173         | Frontend dev server      |
| NODE_ENV       | development  | Development mode         |
| SESSION_SECRET | (dev secret) | Session encryption       |

---

## ✅ Verification Checklist

- [x] Server listening on 0.0.0.0
- [x] Port 3000 accessible locally
- [x] Port 5173 accessible locally
- [x] LAN IP working (192.168.10.197)
- [x] Tailscale configured (100.100.1.1)
- [x] Database initialized
- [x] Real-time (Socket.io) working

---

## 🆘 Troubleshooting

| Issue                        | Solution                                    |
| ---------------------------- | ------------------------------------------- |
| "Cannot connect from mobile" | Check firewall, use correct IP              |
| "Connection refused"         | Server not running, check PID               |
| "Port already in use"        | Kill process: `taskkill /PID <pid> /F`      |
| "Slow connection"            | Check network speed, reduce payload size    |
| "Socket.io not connecting"   | Check CORS, WebSocket proxy settings        |
| "Tailscale not working"      | Reconnect: `tailscale down && tailscale up` |

---

## 📞 Need Help?

- Check server logs in command window
- Enable debug: `NODE_DEBUG=http npm start`
- Monitor: `netstat -ano | findstr :3000`
- Test API: `curl http://192.168.10.197:3000/api/me`
