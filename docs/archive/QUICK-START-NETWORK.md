# Brancher - Quick Start - Network Access

> **ARSIP — digantikan.** Dokumen ini sudah digantikan oleh [`docs/NETWORKING.md`](../NETWORKING.md). Disimpan hanya sebagai riwayat; IP dan konfigurasi di dalamnya sudah usang.

## 🎯 Access Your App

### From Your Machine

```
http://localhost:5173
```

### From Another Device (Tailscale/LAN)

```
http://100.100.1.1:5173
```

---

## ✅ What's Working

| Access Point         | URL                        | Status | Notes                |
| -------------------- | -------------------------- | ------ | -------------------- |
| Local Machine        | http://localhost:5173      | ✅     | Fastest              |
| Tailscale Network    | http://100.100.1.1:5173    | ✅     | Any Tailscale device |
| Same LAN             | http://192.168.10.197:5173 | ✅     | Same WiFi            |
| Hostname (Tailscale) | http://kenz-win10:5173     | ⏳     | Needs DNS config     |

---

## 🔧 Configuration Done

- ✅ Backend listening on 0.0.0.0:3000
- ✅ Frontend listening on 0.0.0.0:5173
- ✅ Vite allowedHosts configured
- ✅ Socket.io proxy working
- ✅ API proxy working
- ✅ Real-time features ready

---

## 📱 Test from Another Device

**Requirements:**

1. Other device has Tailscale installed
2. Connected to same Tailscale network
3. This machine has Tailscale running

**Steps:**

1. Open browser on other device
2. Go to: `http://100.100.1.1:5173`
3. Create account
4. Create branch
5. Send message
6. Verify real-time sync

---

## 🚀 Restart Services

```powershell
Get-Process -Name node | Stop-Process -Force
# Wait 2 seconds
# Then run via run-brancher.ps1
```

---

## 📖 Detailed Docs

- `README.md` - Main documentation
- `DEVELOPMENT.md` - Developer guide
- `NETWORK.md` - Network setup
- `TAILSCALE.md` - Tailscale configuration
- `TROUBLESHOOTING.md` - Common issues

---

## 🎊 Ready to Use!

Your app is exposed to:

- ✅ Localhost
- ✅ Tailscale network
- ✅ Local LAN network

Start testing now! 🚀
