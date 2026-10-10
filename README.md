# Brancher - Platform Komunitas Berbasis Branch

Aplikasi chat komunitas real-time mirip Discord dengan Express.js backend dan React frontend.

## 📋 Quick Start

### Prerequisites

- **Node.js 22+** (built-in SQLite support)
- **npm 11+**

### Setup

1. **Install dependencies**

   ```bash
   npm install  # Installs both server and client
   ```

2. **Configure environment (.env)**

   ```bash
   # File .env sudah tersedia dengan config default
   PORT=3000
   SESSION_SECRET=dev-brancher-secret-change-in-production
   DATA_DIR=./data
   NODE_ENV=development
   ```

3. **Run server (Terminal 1)**

   ```bash
   npm start
   # Server akan berjalan di http://localhost:3000
   ```

4. **Run client dev server (Terminal 2)**

   ```bash
   cd client
   npm run dev
   # Client akan berjalan di http://localhost:5173
   ```

5. **Open browser**
   - Buka http://localhost:5173

---

## 🏗️ Architecture

### **Backend (Express.js + Socket.io)**

- **File**: `server/index.js`, `server/db.js`, `server/helpers.js`
- **Database**: SQLite (auto-initialized di `data/brancher.db`)
- **Port**: 3000
- **Real-time**: Socket.io untuk live messages, presence, typing indicator

### **Frontend (React + Vite)**

- **Files**: `client/src/App.jsx`, `client/src/components/`
- **Dev server**: Vite (proxy ke backend)
- **Build output**: `client/dist/`
- **Port**: 5173 (dev), 3000 (production)

### **Database Schema**

```
users (id, username, email, password_hash, created_at)
branches (id, name, description, invite_code, owner_id, created_at)
memberships (user_id, branch_id, role, created_at) - role: owner|admin|member
channels (id, branch_id, name, type, position) - type: text|announce|voice
messages (id, channel_id, dm_key, user_id, content, file_url, reply_to, pinned, edited, created_at)
friendships (id, requester_id, addressee_id, status, created_at) - status: pending|accepted
reactions (message_id, user_id, emoji)
```

---

## 🔑 Core Features

### **Authentication**

- **Register**: Username + Email + Password (6+ chars, min 3 char username)
- **Login**: Email atau Username + Password
- **Session**: Persistent di SQLite, 30 hari expiry
- **Rate limit**: 30 attempts per 15 min per IP

### **Branches** (komunitas)

- Create branch (pembuat = owner)
- Join via invite code
- 3 default channels: pengumuman, umum, santai
- Roles: owner (full control) | admin (manage channels) | member (read-only in announce)

### **Channels**

- **Text**: bebas semua anggota
- **Announce**: hanya staff yang bisa post
- **Voice**: placeholder (UI ready)

### **Messages**

- Kirim text + file attachment
- Reactions (emoji)
- Edit/Delete pesan (pemilik atau staff)
- Pin messages (staff saja)
- Infinite scroll history
- Reply to messages
- Search messages in channel

### **Direct Messages (DM)**

- Chat 1-on-1 dengan teman
- Friendships: pending → accepted

### **Friends**

- Add friend (request → accept)
- View online status
- Remove friend

### **Real-time Events** (Socket.io)

- Message new/update/delete
- Presence (online users)
- Typing indicator
- Activity notifications
- Member changes
- Channel management

---

## 📁 Directory Structure

```
brancher/
├── server/
│   ├── index.js          (Express app, Socket.io, API endpoints)
│   ├── db.js             (SQLite database initialization)
│   └── helpers.js        (Query helpers, permission checks)
├── client/
│   ├── src/
│   │   ├── App.jsx       (Main React component)
│   │   ├── utils.js      (API helper, formatting functions)
│   │   ├── styles.css    (Global styles)
│   │   ├── main.jsx      (React entry point)
│   │   └── components/
│   │       ├── AuthScreen.jsx      (Login/Register form)
│   │       ├── BranchRail.jsx      (Branch list sidebar)
│   │       ├── BranchSidebar.jsx   (Channel list + members)
│   │       ├── ChatView.jsx        (Message view + input)
│   │       ├── FriendsView.jsx     (Friends list + DM)
│   │       ├── HomeSidebar.jsx     (Home/friends sidebar)
│   │       ├── MemberList.jsx      (Branch members)
│   │       ├── Message.jsx         (Single message + reactions)
│   │       ├── Modal.jsx           (Dialogs)
│   │       └── Icons.jsx           (SVG icons)
│   ├── vite.config.js       (Vite dev proxy config)
│   ├── package.json
│   └── index.html
├── data/                 (Auto-created, persistent storage)
│   ├── brancher.db       (SQLite database file)
│   ├── sessions.db       (Session store)
│   └── uploads/          (File uploads)
├── .env                  (Environment variables)
├── .gitignore
├── package.json          (Root - defines build scripts)
├── package-lock.json
└── Dockerfile
```

---

## 🔗 API Endpoints

### **Auth**

- `POST /api/register` - Register user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/me` - Get current user
- `GET /api/auth/:provider` - OAuth (placeholder)

### **Branches**

- `GET /api/branches` - List user's branches
- `POST /api/branches` - Create branch
- `GET /api/branches/:id` - Get branch detail
- `DELETE /api/branches/:id` - Delete branch (owner only)
- `POST /api/branches/:id/leave` - Leave branch
- `GET /api/invite/:code` - Get invite preview
- `POST /api/invite/:code/join` - Join via invite

### **Channels**

- `POST /api/branches/:id/channels` - Create channel (staff)
- `DELETE /api/channels/:id` - Delete channel (staff)

### **Members**

- `POST /api/branches/:id/members/:userId/role` - Change role (owner)

### **Messages**

- `GET /api/messages/channel/:id` - Get channel messages
- `GET /api/messages/dm/:otherId` - Get DM messages
- `GET /api/messages/pinned/:channelId` - Get pinned messages
- `GET /api/search?q=...&channel=...` - Search messages

### **Files**

- `POST /api/upload` - Upload file

### **Friends**

- `GET /api/friends` - List friends + requests
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/:friendshipId/accept` - Accept request
- `DELETE /api/friends/:friendshipId` - Reject/remove friend

### **Socket.io Events**

**Client → Server:**

- `message:channel` - Send channel message
- `message:dm` - Send DM
- `message:edit` - Edit message
- `message:delete` - Delete message
- `message:react` - Add/remove reaction
- `message:pin` - Pin/unpin message
- `channel:join` - Join channel room
- `branch:subscribe` - Subscribe to branch events
- `typing` - Send typing indicator

**Server → Client:**

- `presence` - Online users list
- `message:channel` - New channel message
- `message:dm` - New DM
- `message:updated` - Message edited/reactions changed
- `message:deleted` - Message deleted
- `typing` - User typing
- `friends:changed` - Friend list changed
- `channel:new` - New channel created
- `channel:deleted` - Channel deleted
- `branch:deleted` - Branch deleted
- `branch:members-changed` - Members/roles changed
- `activity` - Activity notification

---

## 🔒 Security Features

- ✅ Password hashing dengan bcryptjs (salt rounds: 10)
- ✅ Session persistence di SQLite (secure cookies)
- ✅ HTTPS-only cookies di production
- ✅ Rate limiting (30 per 15min) di auth endpoints
- ✅ Authorization checks di semua endpoints
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (HTML escaping + CSP ready)
- ✅ CSRF protection via sessions

**TODO untuk production:**

- [ ] Ubah `SESSION_SECRET` ke string random panjang
- [ ] Set `NODE_ENV=production`
- [ ] Aktifkan HTTPS
- [ ] Implement OAuth (Google/GitHub)
- [ ] Add email verification
- [ ] Add 2FA support

---

## 🐛 Known Issues & TODO

### **npm Vulnerabilities**

- **Status**: Known, non-blocking
- **Cause**: `sqlite3` package → `tar` dependency (build-time only)
- **Impact**: None (server uses built-in `node:sqlite`)
- **Fix**: Will be resolved when `connect-sqlite3` updates

### **Future Enhancements**

- [ ] Voice/video chat integration
- [ ] Message reactions & rich editing
- [ ] Notification settings
- [ ] User profiles & status
- [ ] Rate limiting untuk messages
- [ ] Message threading/conversations
- [ ] Markdown preview
- [ ] Dark mode
- [ ] Mobile responsive design improvements
- [ ] Message export/backup

---

## 📚 Documentation

Comprehensive documentation tersedia di `docs/`:

- **[docs/INDEX.md](docs/INDEX.md)** - Documentation portal (START HERE)
- **[docs/API.md](docs/API.md)** - Complete REST API reference
- **[docs/TECHNOLOGY-RESEARCH.md](docs/TECHNOLOGY-RESEARCH.md)** - Tech stack analysis & optimization
- **[docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)** - Security assessment & roadmap
- **[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)** - UI/UX specifications
- **[docs/AGENT-INSTRUCTIONS.md](docs/AGENT-INSTRUCTIONS.md)** - For developers & agents
- **[docs/TASK-PRIORITIZATION.md](docs/TASK-PRIORITIZATION.md)** - Sprint planning & priorities

---

## 🚀 Deployment

### **Docker**

```bash
docker build -t brancher .
docker run -e PORT=3000 -e SESSION_SECRET=your-secret -v /data:/app/data brancher
```

### **Environment Variables (Production)**

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=<generate-random-string-here>
DATA_DIR=/data  # Mount persistent volume
```

### **Nginx Proxy** (behind HTTPS reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name brancher.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Performance Notes

- **Database**: SQLite dengan WAL mode (efficient concurrent access)
- **Indexes**: Pada `messages.channel_id` dan `messages.dm_key` (fast queries)
- **Message history**: Paginated 50 per request (infinite scroll)
- **Real-time**: Socket.io rooms untuk efficient broadcasting
- **Build size**: ~212KB JS + 15.5KB CSS (gzipped: 68KB + 3.4KB)

---

## 🔧 Development Commands

**Root directory:**

```bash
npm start              # Run server
npm run build          # Build client
npm install            # Install dependencies
npm audit              # Check vulnerabilities
```

**Client directory:**

```bash
npm run dev            # Vite dev server
npm run build          # Production build
npm run preview        # Preview production build
```

---

## 📝 Notes

- **Time Zone**: Uses server timezone for `datetime('now')`
- **File uploads**: Stored in `data/uploads/`, max 10MB
- **Username**: 3-20 chars, alphanumeric + underscore only
- **Email**: Standard validation
- **Password**: Min 6 chars (hash dengan bcryptjs)
- **Locale**: Indonesian (id-ID) untuk timestamps

---

## 📞 Support

Untuk issues atau questions, lihat struktur code:

- Server logic: `server/index.js` (API endpoints)
- Permission checks: `server/helpers.js`
- Database: `server/db.js`
- UI components: `client/src/components/`
- Utilities: `client/src/utils.js`
