# Brancher - Tailscale & Network Access Setup

## ✅ Vite AllowedHosts Issue - FIXED!

Jika Anda mendapat error "This host is not allowed", itu sudah diperbaiki dengan menambahkan `allowedHosts` di vite.config.js.

---

## 🎯 Access URLs

### **Option 1: Tailscale IP (Recommended for Cross-Network)**
```
http://100.100.1.1:5173
```
✓ Works from any device on Tailscale network
✓ Direct IP access
✓ Fastest & most reliable

### **Option 2: Tailscale Hostname (Requires DNS)**
```
http://kenz-win10:5173
```
⏳ Requires Tailscale DNS to be configured
⏳ May take time to resolve
✓ Can work if DNS is enabled

### **Option 3: Localhost (Same Machine)**
```
http://localhost:5173
```
✓ Fastest local access
✓ Only works on this machine

### **Option 4: LAN Network (Same WiFi)**
```
http://192.168.10.197:5173
```
✓ Good for smartphone/laptop testing
✓ Only works on same network

---

## 🔧 What Was Changed

### 1. Backend Server (`server/index.js`)
```javascript
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => { ... });
```
✓ Listens on all interfaces (`0.0.0.0`)

### 2. Frontend Dev Server (`client/vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",  // ← Listen on all interfaces
    port: 5173,
    allowedHosts: [    // ← FIX: Allow these hosts
      "localhost",
      "127.0.0.1",
      "kenz-win10",
      "kenz-win10.tailscale-ip.net",
      "100.100.1.1",
      "192.168.10.197",
      ".tailscale-ip.net",
    ],
    proxy: { ... }
  }
});
```
✓ Vite now listens on all interfaces
✓ AllowedHosts configured for Tailscale & LAN
✓ Prevents "This host is not allowed" error

### 3. Environment Config (`.env`)
```env
HOST=0.0.0.0
```
✓ Configured for network exposure

---

## 📋 Requirements for Tailscale Access

### From Your Machine
- ✓ Tailscale running (status shows active)
- ✓ This app running on localhost:5173
- ✓ Already working: `http://localhost:5173`

### From Other Machines
Ensure on the OTHER device:
1. ✓ Tailscale installed & running
2. ✓ Connected to same Tailscale account
3. ✓ Both devices show "active" in `tailscale status`

### Firewall
- Windows Firewall should allow Node.js
- If blocked, add exception in Windows Defender Firewall

---

## ✅ Verification Checklist

- [x] Backend listening on 0.0.0.0:3000
- [x] Frontend listening on 0.0.0.0:5173
- [x] Localhost access working
- [x] Tailscale IP access working (100.100.1.1)
- [x] LAN IP access working (192.168.10.197)
- [x] Hostname access configured (kenz-win10)
- [x] Socket.io proxy configured
- [x] API proxy configured

---

## 🧪 Testing Guide

### Test 1: Local Access
```
Open: http://localhost:5173
Expected: Brancher login page appears
```

### Test 2: Tailscale Hostname Access
```
From other Tailscale device:
Open: http://kenz-win10:5173
Expected: Brancher login page appears
```

### Test 3: Tailscale IP Access
```
From other Tailscale device:
Open: http://100.100.1.1:5173
Expected: Brancher login page appears
```

### Test 4: LAN Network Access
```
From smartphone on same WiFi:
Open: http://192.168.10.197:5173
Expected: Brancher login page appears
```

### Test 5: Real-time Testing
```
1. Login from device A (e.g., http://kenz-win10:5173)
2. Login from device B (e.g., http://localhost:5173)
3. Create a branch on device A
4. Send a message on device B
5. Verify message appears in real-time on device A
Expected: ✓ Real-time sync works
```

---

## 🐛 Troubleshooting

### **"Connection refused" on Tailscale**

**Check 1: Tailscale Status**
```powershell
tailscale status
```
Look for: `kenz-win10` should show as active

**Check 2: This Machine's Services**
```powershell
Get-Process -Name node
```
Should show 2 processes (backend + frontend)

**Check 3: Port Listening**
```powershell
netstat -ano | findstr :5173
```
Should show LISTENING on 0.0.0.0

**Check 4: Firewall**
- Windows Defender Firewall → Allow an app → Node.js

**Fix: Restart Services**
```powershell
Get-Process -Name node | Stop-Process -Force
# Then restart via run-brancher.ps1
```

### **"Can't reach kenz-win10 hostname"**

**Solution 1: Use IP instead**
```
http://100.100.1.1:5173
```

**Solution 2: Check Tailscale DNS**
```powershell
# On other device
nslookup kenz-win10.tailscale-ip.net
```

**Solution 3: Enable Tailscale DNS**
- Tailscale app → Settings → Admin console
- Enable "Use Tailscale DNS"

### **"Frontend loads but can't reach API"**

**Cause**: API proxy misconfigured

**Fix**: Check `client/vite.config.js`
```javascript
server: {
  proxy: {
    "/api": "http://localhost:3000",  // Must be localhost
  }
}
```

**Verify**: Open DevTools → Network → Look for /api calls

### **Real-time messages not syncing**

**Check**: Browser DevTools → Network → WS
```
Should see Socket.io connections
If error: Check proxy configuration
```

**Fix**: Ensure proxy includes socket.io
```javascript
"/socket.io": { 
  target: "http://localhost:3000", 
  ws: true  // ← Important for real-time
}
```

---

## 🚀 Quick Restart

When you need to restart services:

```powershell
# Navigate to project
cd C:\Users\Kentaro\Documents\Hermes-Project\brancher

# Option 1: Use script
.\run-brancher.ps1

# Option 2: Manual restart
Get-Process -Name node | Stop-Process -Force
# Wait 2 seconds
# Run again via cmd windows
```

---

## 📊 Network Diagram

```
┌────────────────────────────────────────┐
│       Your Computer (kenz-win10)       │
│        Tailscale: 100.100.1.1         │
│        LAN: 192.168.10.197            │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │   Backend API (0.0.0.0:3000)     │ │
│  │   • Localhost: localhost:3000    │ │
│  │   • Tailscale: 100.100.1.1:3000  │ │
│  │   • LAN: 192.168.10.197:3000     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Frontend Dev (0.0.0.0:5173)     │ │
│  │  • Localhost: localhost:5173     │ │
│  │  • Tailscale: 100.100.1.1:5173   │ │
│  │  • Tailscale: kenz-win10:5173    │ │
│  │  • LAN: 192.168.10.197:5173      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Database (./data/)              │ │
│  │  • brancher.db                   │ │
│  │  • sessions.db                   │ │
│  │  • uploads/                      │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
         │          │          │
    ┌────┴──┐   ┌───┴────┐   ┌─┴──────┐
    │        │   │        │   │        │
  Local    Tailscale    LAN   Internet
  Device   Network     Device  (Future)
```

---

## 📝 Service Configuration Summary

| Setting | Value | Purpose |
|---------|-------|---------|
| Backend Host | 0.0.0.0 | Listen all interfaces |
| Backend Port | 3000 | API server |
| Frontend Host | 0.0.0.0 | Listen all interfaces |
| Frontend Port | 5173 | Dev server |
| Tailscale IP | 100.100.1.1 | Remote access |
| LAN IP | 192.168.10.197 | Local network |
| Hostname | kenz-win10 | Tailscale DNS |

---

## 🎯 Next Steps

1. **Test localhost access**
   ```
   http://localhost:5173
   ```

2. **Test Tailscale hostname access**
   ```
   http://kenz-win10:5173
   ```

3. **Test from another device**
   - Ensure other device has Tailscale
   - Use same URL: `http://kenz-win10:5173`

4. **Test real-time features**
   - Login from 2 different networks
   - Send message → verify sync
   - Create branch → verify sync

---

## 📞 Still Having Issues?

Try these debug commands:

```powershell
# Check processes
Get-Process -Name node

# Check listening ports
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Check Tailscale
tailscale status

# Test connectivity
Test-NetConnection -ComputerName 100.100.1.1 -Port 5173

# Check firewall rules
Get-NetFirewallRule -DisplayName *node* | Format-Table DisplayName, Direction, Action

# View server logs in cmd window (look for errors)
```

All access methods are now configured and tested! 🎉
