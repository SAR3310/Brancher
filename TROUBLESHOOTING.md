# Brancher - Troubleshooting & FAQ

## ⚠️ Common Issues & Solutions

### **Server Issues**

#### ❌ "Port 3000 already in use"

```bash
# Windows: Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

#### ❌ "Cannot find module 'express'"

```bash
# Run in root directory:
npm install
```

#### ❌ "ENOENT: no such file or directory, open 'brancher.db'"

- Database file will auto-create on first run
- Ensure `data/` folder has write permissions
- Check `NODE_ENV` and `DATA_DIR` in `.env`

#### ❌ "DatabaseSync is not a constructor"

- **Cause**: Node.js < 22 (SQLite not available)
- **Fix**: Upgrade Node.js to 22+

```bash
node --version  # Must be v22.0.0 or higher
```

#### ❌ "Session not persisting after restart"

- Check `sessions.db` exists in `data/` folder
- Verify `DATA_DIR=./data` in `.env`
- Clear browser cookies and try again

#### ❌ "Cannot POST /api/upload" - File upload fails

- Check `data/uploads/` folder exists
- Verify folder permissions (should be writable)
- Check file size < 10MB (configured in multer)

---

### **Client Issues**

#### ❌ "Cannot GET /api/*" when running dev server

- **Cause**: Dev server not proxying to backend
- **Fix**: Check `client/vite.config.js` has proxy config
- **Verify**: Backend is running on `http://localhost:3000`

#### ❌ "WebSocket connection failed"

- **Cause**: Socket.io connection timeout
- **Check**:
  - Backend server is running
  - No firewall blocking port 3000
  - Browser console for errors
  - Network tab in DevTools

#### ❌ "Messages not appearing in real-time"

- Browser console might show Socket.io errors
- Check if Socket.io is listening: `localhost:3000/socket.io/`
- Try hard refresh (Ctrl+Shift+R)
- Check browser cache: DevTools → Application → Clear Storage

#### ❌ Blank screen / "500" error

- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Verify API is responding: `http://localhost:3000/api/me`

#### ❌ "Vite is not defined"

- **Cause**: Using old node command from wrong directory
- **Fix**: Run from `client/` directory:

```bash
cd client
npm run dev
```

---

### **Database Issues**

#### ❌ "database is locked"

- **Cause**: Multiple processes accessing SQLite
- **Symptoms**: Random "database locked" errors
- **Solutions**:
  - Ensure only one server instance running
  - Restart server
  - Delete `brancher.db` and restart (loses data!)
  - Database is using WAL mode (should be fine)

#### ❌ "UNIQUE constraint failed: username"

- User with that username already exists
- Check database:

```bash
sqlite3 data/brancher.db "SELECT * FROM users"
```

#### ❌ "no such table: users"

- **Cause**: Database not initialized
- **Fix**: Restart server (schema auto-creates)
- Or manually init:

```javascript
const { db } = require("./server/db");
// db.exec() will create tables if not exist
```

---

### **Authentication Issues**

#### ❌ "Akun atau password salah" when credentials seem correct

- Password is case-sensitive
- Username check is case-insensitive (stored as COLLATE NOCASE)
- Try login with email instead of username
- Check for trailing spaces in input

#### ❌ "Sudah bergabung" when trying to join branch

- Already a member - try leaving first
- Check browser session isn't cached

#### ❌ "Link undangan tidak valid"

- Invite code expired? No, codes don't expire
- Check code spelling
- Branch might be deleted
- User might be banned (not implemented)

---

### **Permission Issues**

#### ❌ "Hanya admin branch"

- Only admin/owner can perform this action
- Ask branch owner to promote you
- Or check who owns the branch

#### ❌ "Hanya owner"

- Only branch owner can delete/reset branch
- Contact branch owner if needed

#### ❌ "Tidak punya akses" to channel

- Not a member of the branch
- Request invite code from member
- Can't access deleted branch

#### ❌ "Hanya bisa DM dengan teman"

- Must add as friend first
- Send friend request and wait for acceptance

---

## 🔍 Debugging Tips

### **Enable Logging**

Add to `server/index.js` for debugging:

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### **Check Database Directly**

```bash
sqlite3 data/brancher.db
sqlite> SELECT * FROM users;
sqlite> SELECT * FROM branches;
sqlite> SELECT * FROM messages LIMIT 10;
```

### **Monitor Socket.io**

Browser DevTools → Network → WS (WebSocket) tab:

- Shows Socket.io packets
- Check for connection errors
- Monitor message throughput

### **Test API Endpoints**

```bash
# Register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"123456"}' \
  -c cookies.txt

# Get user (with session)
curl http://localhost:3000/api/me -b cookies.txt
```

### **Browser Console Tricks**

```javascript
// Check Socket.io connection
io.engine.on("error", (e) => console.error(e));
io.on("connect_error", (e) => console.error(e));

// Monitor all socket events
io.onAny((event, ...args) => console.log(event, args));

// Send test message
socket.emit("message:channel", {
  channelId: 1,
  content: "Test message",
  fileUrl: null,
  fileName: null,
  replyTo: null,
});
```

---

## 🚀 Performance Debugging

### **Slow Message Loading**

- Check browser Network tab
- Is infinite scroll working? (50 messages per request)
- Database query might be slow:

```bash
sqlite3 data/brancher.db
sqlite> EXPLAIN QUERY PLAN SELECT * FROM messages WHERE channel_id = 1 ORDER BY id DESC LIMIT 50;
```

### **High CPU Usage**

- Check for infinite loops in components
- Profile in DevTools (Chrome) → Performance tab
- Look for excessive re-renders

### **Memory Leak**

- Check DevTools → Memory tab
- Take heap snapshots before/after actions
- Look for growing memory

---

## 📊 Database Maintenance

### **Backup Database**

```bash
cp data/brancher.db data/brancher.db.backup
cp data/sessions.db data/sessions.db.backup
```

### **Restore Database**

```bash
cp data/brancher.db.backup data/brancher.db
# Restart server
npm start
```

### **Clear Old Sessions**

```bash
sqlite3 data/sessions.db
sqlite> DELETE FROM sessions WHERE created_at < datetime('now', '-30 days');
```

### **Vacuum Database** (optimize size)

```bash
sqlite3 data/brancher.db "VACUUM;"
```

---

## 🐛 Reporting Bugs

When reporting a bug, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/Node version**
5. **Error message from console**
6. **Server logs** (if applicable)
7. **Screenshots** (if UI bug)

---

## ✅ Quick Diagnostics Checklist

```bash
# 1. Node version check
node --version  # Should be v22+

# 2. Dependencies installed
npm list  # Check for missing packages

# 3. Database exists
ls -la data/brancher.db

# 4. Server running
curl http://localhost:3000/api/me

# 5. Client running (separate terminal)
curl http://localhost:5173

# 6. Database integrity
sqlite3 data/brancher.db "PRAGMA integrity_check;"

# 7. Clear npm cache
npm cache clean --force

# 8. Reinstall if needed
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security & Issues Reporting

**For security vulnerabilities**: See `docs/SECURITY-AUDIT.md` for known issues and remediation roadmap.

**Current Security Status**:

- ✅ Passwords hashed with bcryptjs
- ✅ Rate limiting on auth endpoints
- ⚠️ Input validation incomplete (see `docs/SECURITY-AUDIT.md` for details)
- ⚠️ CSRF protection not implemented (in Phase 1 roadmap)
- ⚠️ Logging not structured (in Phase 1 roadmap)

See `docs/INDEX.md` for complete documentation and development roadmap.

---

## 📚 Resources

- **Express.js**: https://expressjs.com/
- **Socket.io**: https://socket.io/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **SQLite**: https://www.sqlite.org/
- **Node.js SQLite**: https://nodejs.org/api/sqlite.html
