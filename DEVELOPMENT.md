# Brancher Development Guide

## 🛠️ Development Setup

### Quick Start
```bash
# Terminal 1: Server
npm start

# Terminal 2: Client dev server
cd client && npm run dev

# Open http://localhost:5173
```

### Code Structure

#### **Server (`server/`)**
- **index.js**: Main Express app - all routes and Socket.io handlers
- **db.js**: SQLite database initialization and schema
- **helpers.js**: Shared utilities - permission checks, query helpers

#### **Client (`client/src/`)**
- **App.jsx**: Main component - state management, navigation
- **components/**: Reusable React components
  - **AuthScreen.jsx**: Login/Register forms
  - **ChatView.jsx**: Message view + input (largest component)
  - **BranchRail.jsx**: Left sidebar - branch list
  - **BranchSidebar.jsx**: Channel list (in branch view)
  - **HomeSidebar.jsx**: Friends/DM list (in home view)
  - **FriendsView.jsx**: Friends management view
  - **MemberList.jsx**: Branch members panel
  - **Message.jsx**: Single message with reactions
  - **Modal.jsx**: Dialogs (create branch, join, create channel, invite)
  - **Icons.jsx**: SVG icons
- **utils.js**: API fetch helper, text formatting, time formatting
- **styles.css**: Global styles
- **main.jsx**: React entry point

### Key Files Explained

#### `server/index.js` - What's What
- **Lines 1-30**: Imports & middleware
- **Lines 30-55**: Session & rate limiting setup
- **Lines 56-66**: File upload configuration
- **Lines 68-122**: AUTH endpoints (register, login, logout)
- **Lines 124-243**: BRANCH endpoints (create, join, manage)
- **Lines 246-300**: FRIENDS endpoints
- **Lines 302-340**: MESSAGE endpoints (history, search, upload)
- **Lines 342-480**: SOCKET.IO handlers (real-time)
- **Lines 482-495**: Client static serving (SPA)

#### `server/db.js` - Schema
Tables auto-created:
- `users` - username, email, password_hash
- `branches` - community spaces
- `memberships` - join table with roles
- `channels` - text/announce/voice channels
- `messages` - channel + DM messages
- `friendships` - pending/accepted friend requests
- `reactions` - emoji reactions on messages

#### `server/helpers.js` - Utility Functions
- `MSG_SELECT` - SQL template for message queries with joins
- `branchRole(userId, branchId)` - returns user's role or null
- `isBranchStaff()` - true if owner/admin
- `channelForMember()` - verify access + get channel
- `areFriends()` - check if two users are friends
- `dmKey()` - normalize DM key (always idSmall-idBesar)
- `attachReactions()` - fetch & group reactions for messages
- `getMessage()` - get single message with reactions

#### `client/src/utils.js` - Helpers
- `api(url, method, body)` - fetch wrapper with error handling
- `formatContent(text, username)` - markdown + mentions + links
- `extractPreviews(text)` - detect YouTube/images
- `timeStr(createdAt)` - format time (id-ID locale)
- `EMOJIS` - reaction emoji set

### Common Workflows

#### **Adding a New API Endpoint**
1. Add route in `server/index.js`
2. Check auth with `requireLogin` middleware
3. Validate input
4. Check authorization using helpers
5. Query database with parameterized queries
6. Emit Socket.io event if needed (for live updates)
7. Return JSON response

Example:
```javascript
app.post("/api/something", requireLogin, (req, res) => {
  const { param } = req.body;
  // Validate
  if (!param) return res.status(400).json({ error: "..." });
  // Auth check
  const role = H.branchRole(req.session.userId, branchId);
  if (role !== "owner") return res.status(403).json({ error: "..." });
  // Query
  db.prepare("INSERT ...").run(...);
  // Real-time update
  io.to("branch:" + branchId).emit("event:name", data);
  res.json({ ok: true });
});
```

#### **Adding a New React Component**
1. Create file in `client/src/components/`
2. Use hooks: `useState`, `useEffect`, `useCallback`, `useRef`
3. Call API with `api()` helper from utils
4. Use Socket.io via `socket` prop (passed from App)
5. Export default component

Example:
```javascript
export default function MyComponent({ me, socket, onUpdate }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api("/api/endpoint").then(setData);
  }, []);
  
  useEffect(() => {
    if (!socket) return;
    socket.on("event", onUpdate);
    return () => socket.off("event", onUpdate);
  }, [socket]);
  
  return <div>...</div>;
}
```

#### **Adding a Real-time Feature**
1. Add Socket.io event handler in `server/index.js`
2. Broadcast with `io.to(room).emit(event, data)`
3. Add listener in client component
4. Update state on event
5. Clean up listeners in useEffect return

### Database Queries

Always use parameterized queries to prevent SQL injection:
```javascript
// ✅ GOOD
db.prepare("SELECT * FROM users WHERE id = ?").get(userId)

// ❌ BAD - SQL injection risk
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get()
```

Common patterns:
```javascript
// Select one
db.prepare("SELECT * FROM users WHERE id = ?").get(id)

// Select multiple
db.prepare("SELECT * FROM messages WHERE channel_id = ? ORDER BY id").all(channelId)

// Insert with last ID
const r = db.prepare("INSERT INTO users (...) VALUES (?, ?)").run(val1, val2)
const newId = Number(r.lastInsertRowid)

// Update
db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id)

// Delete
db.prepare("DELETE FROM messages WHERE id = ?").run(messageId)
```

### Socket.io Rooms

User-specific room: `user:${userId}` - for personal messages
Branch room: `branch:${branchId}` - for branch-wide events
Channel room: `channel:${channelId}` - for channel messages

```javascript
// Broadcasting
io.to("branch:5").emit("message", data)  // To specific branch

// User-specific
io.to("user:123").emit("notification", data)  // To specific user

// Everyone
io.emit("presence", onlineUsers)  // Broadcast to all
```

### Authentication Flow

1. User submits register/login
2. Password validated with bcryptjs
3. Session created: `req.session.userId = user.id`
4. Session persisted to SQLite
5. Client checks `/api/me` on startup
6. Socket.io connection requires session

### File Upload Flow

1. Client selects file → `uploadFile(e)`
2. FormData sent to `/api/upload`
3. Multer saves to `data/uploads/` with unique name
4. Server returns URL `/uploads/filename`
5. Client sends message with file URL
6. File displayed inline (images) or as link

### Styling

Global styles in `client/src/styles.css`:
- CSS Grid layout for app structure
- CSS custom properties for colors
- Mobile-first responsive design (ready to improve)

Class naming:
- `.app` - main container
- `.chat` - message view
- `.sidebar`, `.rail` - navigation
- `.message` - single message
- `.button`, `.input` - form elements

### Testing

#### Manually test:
1. Create account
2. Create branch with invite code
3. Join same branch in different browser tab
4. Send message → should appear real-time
5. Edit/delete message
6. Add friend → request/accept
7. Send DM

#### API testing:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

### Common Issues & Fixes

**Issue: "Belum login" error**
- Cause: No session or expired session
- Fix: User needs to re-login

**Issue: "Bukan anggota branch ini"**
- Cause: User trying to access branch they're not member of
- Fix: Check user joined the branch (verify in database)

**Issue: File upload fails**
- Cause: Permission issue or disk full
- Fix: Check `data/uploads/` folder exists and is writable

**Issue: Real-time message not appearing**
- Cause: Socket.io connection issue
- Fix: Check browser console for errors, server logs

**Issue: Database locked**
- Cause: Multiple processes accessing SQLite simultaneously
- Fix: WAL mode helps, but ensure single server instance

### Performance Tips

1. **Message pagination**: Load 50 at a time, not all history
2. **Reactions**: Grouped by emoji to reduce re-renders
3. **Socket rooms**: Only join necessary rooms
4. **Avoid**: Large objects in state, deep nesting in queries

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `SESSION_SECRET` to random string
- [ ] Set up HTTPS (required for secure cookies)
- [ ] Configure persistent volume for `data/`
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Run `npm run build` for client
- [ ] Test email verification (if implementing)
- [ ] Monitor error logs
- [ ] Backup database regularly
