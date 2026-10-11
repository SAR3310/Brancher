# Brancher - Login Error Fix

> **ARSIP — belum terverifikasi.** Dokumen ini adalah catatan sesi kerja lama. Klaim seperti "production ready", "100%", atau "Stability ✅" di dalamnya **tidak dapat dipercaya**: beberapa bug (backend crash saat start, login gagal karena kontrak field API) lolos dari laporan-laporan ini. Lihat `CHANGELOG.md` untuk status terkini. Dokumen ini hanya disimpan sebagai riwayat.

## 🔴 Error: "Terjadi Kesalahan" (An Error Occurred)

Jika Anda mendapat error saat login/register, masalahnya kemungkinan:

1. **Backend API tidak terhubung**
2. **Browser cache lama**
3. **Session timeout**
4. **API endpoint error**

---

## ✅ Solutions

### Solution 1: Refresh Browser (Most Common)

```
Press: Ctrl + R  (or Ctrl + Shift + R for hard refresh)
Or:    F5        (reload page)
```

**Why?** Frontend mungkin load sebelum backend fully initialized.

---

### Solution 2: Clear Browser Cache

```
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Clear Storage"
4. Refresh page (Ctrl + R)
5. Try again
```

**Why?** Old session data atau stale API response di cache.

---

### Solution 3: Check Backend is Running

```powershell
# Check if backend port is listening
netstat -ano | findstr :3000

# Should show: LISTENING
# If not: Backend crashed, need restart
```

---

### Solution 4: Restart Services

```powershell
# Kill all Node processes
Get-Process -Name node | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Restart via run-brancher.ps1
```

---

## 🧪 Testing the API Directly

Before trying login, test if API works:

```powershell
# Test API endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/me" -ErrorAction Stop

# Should return 401 (Unauthorized) - that's OK, means API works
# If times out: Backend not responding
```

---

## 🐛 Common Causes & Fixes

| Symptom                      | Cause               | Fix                  |
| ---------------------------- | ------------------- | -------------------- |
| "Terjadi kesalahan" on login | API not responding  | Restart backend      |
| Error persists after refresh | Session issue       | Clear browser cache  |
| Can't reach localhost:3000   | Backend crashed     | Check PID, restart   |
| Database error               | DB locked           | Wait 10 sec, restart |
| CORS error in console        | Proxy misconfigured | Check vite.config.js |

---

## 🔍 Debugging Steps

### Step 1: Check Services Running

```powershell
Get-Process -Name node

# Should show 2 processes minimum
# If 0: Nothing running, start services
```

### Step 2: Check Ports Listening

```powershell
netstat -ano | findstr :3000  # Should show LISTENING
netstat -ano | findstr :5173  # Should show LISTENING
```

### Step 3: Test API

```powershell
# From PowerShell
Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction Stop

# Should return 200 or 401
# If timeout: Backend not listening
```

### Step 4: Check Browser Console

```
1. Press F12 to open DevTools
2. Go to "Console" tab
3. Look for red error messages
4. Check "Network" tab for failed requests
```

### Step 5: Check Backend Logs

```
1. Look at the backend command window (npm start)
2. Look for error messages
3. If you see errors, copy them
```

---

## 🚀 Quick Fix Flow

```
1. Refresh browser (Ctrl + R)
   ↓ If still error...
2. Hard refresh (Ctrl + Shift + R)
   ↓ If still error...
3. Clear cache (DevTools → Application → Clear Storage)
   ↓ If still error...
4. Restart backend (kill node processes + restart)
   ↓ If still error...
5. Check backend logs (look at command window)
```

---

## 📝 What's Happening

When you try to login:

```
Browser (Frontend)
    ↓ sends POST /api/login
Backend API
    ↓ validates credentials
SQLite Database
    ↓ checks user
Response
    ↓ returns user data
Frontend updates
    ↓ shows branches
```

If error at any step → "Terjadi kesalahan"

---

## ✅ Verification Checklist

- [ ] Backend running? `Get-Process -Name node` should show processes
- [ ] Port 3000 listening? `netstat -ano | findstr :3000`
- [ ] Frontend running? Browser can load http://localhost:5173
- [ ] API responding? No timeout errors in console
- [ ] Database ready? No "database locked" messages
- [ ] Firewall allowing? Windows Firewall not blocking Node.js

---

## 🆘 If All Else Fails

1. **Kill everything**

   ```powershell
   Get-Process -Name node | Stop-Process -Force
   Get-Process -Name cmd | Stop-Process -Force
   ```

2. **Delete database** (WARNING: Loses data)

   ```powershell
   Remove-Item -Path "data\brancher.db" -Force
   Remove-Item -Path "data\sessions.db" -Force
   ```

3. **Restart fresh**

   ```powershell
   cd brancher
   .\run-brancher.ps1
   ```

4. **Wait full 10 seconds** for everything to initialize

5. **Try login again**

---

## 📞 Need More Help?

Check these files:

- `TROUBLESHOOTING.md` - General troubleshooting
- `DEVELOPMENT.md` - Code structure
- `NETWORK.md` - Network access issues
- Backend logs in command window

All access methods should work now! 🚀
