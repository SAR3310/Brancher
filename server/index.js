// ============================================================
// Brancher - Server utama
// Siap deployment: konfigurasi via environment variable
//   PORT            (default 3000)
//   DATA_DIR        (default ./data) - database, session, upload
//   SESSION_SECRET  (WAJIB diganti di produksi)
// ============================================================
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { nanoid } = require("nanoid");

const { db, DATA_DIR, UPLOAD_DIR } = require("./db");
const H = require("./helpers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PROD = process.env.NODE_ENV === "production";
if (PROD) app.set("trust proxy", 1); // di belakang reverse proxy hosting

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

// Session persisten di SQLite (tahan restart server)
const sessionMiddleware = session({
  store: new SQLiteStore({ db: "sessions.db", dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || "dev-secret-ganti-di-produksi",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 hari
    httpOnly: true,
    secure: PROD, // hanya HTTPS di produksi
  },
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// Rate limit endpoint auth: cegah brute-force password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Terlalu banyak percobaan, coba lagi nanti" },
});

// ---------- UPLOAD ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, Date.now() + "-" + nanoid(6) + "-" + safe);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Belum login" });
  next();
}

// ============================================================
// AUTH  (email + username; OAuth Google/GitHub menyusul
//        setelah punya URL publik)
// ============================================================
app.post("/api/register", authLimiter, (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Username 3-20 karakter, huruf/angka/underscore" });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Email tidak valid" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter" });
  }
  if (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
    return res.status(400).json({ error: "Username sudah dipakai" });
  }
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return res.status(400).json({ error: "Email sudah terdaftar" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)").run(username, email, hash);
  req.session.userId = Number(r.lastInsertRowid);
  req.session.username = username;
  res.json({ id: req.session.userId, username });
});

app.post("/api/login", authLimiter, (req, res) => {
  const { identifier, password } = req.body; // identifier = email ATAU username
  const user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(identifier, identifier);
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Akun atau password salah" });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ id: user.id, username: user.username });
});

app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get("/api/me", requireLogin, (req, res) => {
  res.json({ id: req.session.userId, username: req.session.username });
});

// Placeholder OAuth: nanti diaktifkan setelah deploy
app.get("/api/auth/:provider", (req, res) => {
  res.status(501).json({ error: "Login " + req.params.provider + " akan tersedia setelah aplikasi online" });
});

// ============================================================
// BRANCH
// ============================================================
// Daftar branch yang saya ikuti
app.get("/api/branches", requireLogin, (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, m.role FROM branches b
    JOIN memberships m ON m.branch_id = b.id
    WHERE m.user_id = ? ORDER BY m.created_at
  `).all(req.session.userId);
  res.json(rows);
});

// Buat branch baru (pembuat jadi owner, channel default dibuat)
app.post("/api/branches", requireLogin, (req, res) => {
  const name = (req.body.name || "").trim().slice(0, 50);
  if (name.length < 2) return res.status(400).json({ error: "Nama branch minimal 2 karakter" });
  const invite = nanoid(8);
  const r = db.prepare("INSERT INTO branches (name, description, invite_code, owner_id) VALUES (?, ?, ?, ?)").run(name, (req.body.description || "").slice(0, 200), invite, req.session.userId);
  const branchId = Number(r.lastInsertRowid);
  db.prepare("INSERT INTO memberships (user_id, branch_id, role) VALUES (?, ?, 'owner')").run(req.session.userId, branchId);
  const insCh = db.prepare("INSERT INTO channels (branch_id, name, type, position) VALUES (?, ?, ?, ?)");
  insCh.run(branchId, "pengumuman", "announce", 0);
  insCh.run(branchId, "umum", "text", 1);
  insCh.run(branchId, "santai", "text", 2);
  res.json(db.prepare("SELECT * FROM branches WHERE id = ?").get(branchId));
});

// Info undangan (tanpa join dulu — untuk halaman preview)
app.get("/api/invite/:code", requireLogin, (req, res) => {
  const b = db.prepare("SELECT id, name, description FROM branches WHERE invite_code = ?").get(req.params.code);
  if (!b) return res.status(404).json({ error: "Link undangan tidak valid" });
  const members = db.prepare("SELECT COUNT(*) AS c FROM memberships WHERE branch_id = ?").get(b.id).c;
  const joined = !!H.branchRole(req.session.userId, b.id);
  res.json({ ...b, members, joined });
});

// Join branch via kode undangan
app.post("/api/invite/:code/join", requireLogin, (req, res) => {
  const b = db.prepare("SELECT * FROM branches WHERE invite_code = ?").get(req.params.code);
  if (!b) return res.status(404).json({ error: "Link undangan tidak valid" });
  if (H.branchRole(req.session.userId, b.id)) return res.status(400).json({ error: "Sudah bergabung" });
  db.prepare("INSERT INTO memberships (user_id, branch_id, role) VALUES (?, ?, 'member')").run(req.session.userId, b.id);
  io.to("branch:" + b.id).emit("branch:members-changed", { branchId: b.id });
  res.json({ ...b, role: "member" });
});

// Detail branch: channel + anggota
app.get("/api/branches/:id", requireLogin, (req, res) => {
  const branchId = Number(req.params.id);
  const role = H.branchRole(req.session.userId, branchId);
  if (!role) return res.status(403).json({ error: "Bukan anggota branch ini" });
  const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(branchId);
  const channels = db.prepare("SELECT * FROM channels WHERE branch_id = ? ORDER BY position, id").all(branchId);
  const members = db.prepare(`
    SELECT u.id, u.username, m.role FROM memberships m
    JOIN users u ON u.id = m.user_id WHERE m.branch_id = ?
    ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.username
  `).all(branchId);
  res.json({ ...branch, myRole: role, channels, members });
});

// Buat channel (staff saja)
app.post("/api/branches/:id/channels", requireLogin, (req, res) => {
  const branchId = Number(req.params.id);
  if (!H.isBranchStaff(req.session.userId, branchId)) return res.status(403).json({ error: "Hanya admin branch" });
  const name = (req.body.name || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30);
  const type = ["text", "announce", "voice"].includes(req.body.type) ? req.body.type : "text";
  if (!name) return res.status(400).json({ error: "Nama channel tidak valid" });
  const r = db.prepare("INSERT INTO channels (branch_id, name, type, position) VALUES (?, ?, ?, 99)").run(branchId, name, type);
  const ch = db.prepare("SELECT * FROM channels WHERE id = ?").get(Number(r.lastInsertRowid));
  io.to("branch:" + branchId).emit("channel:new", ch);
  res.json(ch);
});

// Hapus channel (staff saja)
app.delete("/api/channels/:id", requireLogin, (req, res) => {
  const ch = db.prepare("SELECT * FROM channels WHERE id = ?").get(Number(req.params.id));
  if (!ch) return res.status(404).json({ error: "Channel tidak ada" });
  if (!H.isBranchStaff(req.session.userId, ch.branch_id)) return res.status(403).json({ error: "Hanya admin branch" });
  db.prepare("DELETE FROM messages WHERE channel_id = ?").run(ch.id);
  db.prepare("DELETE FROM channels WHERE id = ?").run(ch.id);
  io.to("branch:" + ch.branch_id).emit("channel:deleted", { id: ch.id, branchId: ch.branch_id });
  res.json({ ok: true });
});

// Ubah role anggota (owner saja)
app.post("/api/branches/:id/members/:userId/role", requireLogin, (req, res) => {
  const branchId = Number(req.params.id);
  const targetId = Number(req.params.userId);
  if (H.branchRole(req.session.userId, branchId) !== "owner") return res.status(403).json({ error: "Hanya owner" });
  if (targetId === req.session.userId) return res.status(400).json({ error: "Tidak bisa mengubah role sendiri" });
  const role = req.body.role === "admin" ? "admin" : "member";
  db.prepare("UPDATE memberships SET role = ? WHERE user_id = ? AND branch_id = ?").run(role, targetId, branchId);
  io.to("branch:" + branchId).emit("branch:members-changed", { branchId });
  res.json({ ok: true });
});

// Keluar dari branch (owner tidak bisa keluar, harus hapus branch)
app.post("/api/branches/:id/leave", requireLogin, (req, res) => {
  const branchId = Number(req.params.id);
  const role = H.branchRole(req.session.userId, branchId);
  if (!role) return res.status(400).json({ error: "Bukan anggota" });
  if (role === "owner") return res.status(400).json({ error: "Owner tidak bisa keluar. Hapus branch jika ingin menutupnya." });
  db.prepare("DELETE FROM memberships WHERE user_id = ? AND branch_id = ?").run(req.session.userId, branchId);
  io.to("branch:" + branchId).emit("branch:members-changed", { branchId });
  res.json({ ok: true });
});

// Hapus branch (owner saja)
app.delete("/api/branches/:id", requireLogin, (req, res) => {
  const branchId = Number(req.params.id);
  if (H.branchRole(req.session.userId, branchId) !== "owner") return res.status(403).json({ error: "Hanya owner" });
  const chIds = db.prepare("SELECT id FROM channels WHERE branch_id = ?").all(branchId).map((c) => c.id);
  for (const id of chIds) db.prepare("DELETE FROM messages WHERE channel_id = ?").run(id);
  db.prepare("DELETE FROM channels WHERE branch_id = ?").run(branchId);
  db.prepare("DELETE FROM memberships WHERE branch_id = ?").run(branchId);
  db.prepare("DELETE FROM branches WHERE id = ?").run(branchId);
  io.to("branch:" + branchId).emit("branch:deleted", { id: branchId });
  res.json({ ok: true });
});

// ============================================================
// FRIENDS
// ============================================================
app.get("/api/friends", requireLogin, (req, res) => {
  const uid = req.session.userId;
  const rows = db.prepare(`
    SELECT f.id, f.status, f.requester_id,
      u.id AS user_id, u.username
    FROM friendships f
    JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
    WHERE f.requester_id = ? OR f.addressee_id = ?
  `).all(uid, uid, uid);
  res.json(rows.map((r) => ({
    friendshipId: r.id,
    userId: r.user_id,
    username: r.username,
    status: r.status,
    incoming: r.status === "pending" && r.requester_id !== uid,
  })));
});

app.post("/api/friends/request", requireLogin, (req, res) => {
  const target = db.prepare("SELECT id, username FROM users WHERE username = ?").get((req.body.username || "").trim());
  if (!target) return res.status(404).json({ error: "User tidak ditemukan" });
  if (target.id === req.session.userId) return res.status(400).json({ error: "Tidak bisa menambahkan diri sendiri" });
  const existing = db.prepare(`
    SELECT * FROM friendships
    WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
  `).get(req.session.userId, target.id, target.id, req.session.userId);
  if (existing) return res.status(400).json({ error: existing.status === "accepted" ? "Sudah berteman" : "Permintaan sudah ada" });
  db.prepare("INSERT INTO friendships (requester_id, addressee_id) VALUES (?, ?)").run(req.session.userId, target.id);
  io.to("user:" + target.id).emit("friends:changed");
  res.json({ ok: true });
});

app.post("/api/friends/:friendshipId/accept", requireLogin, (req, res) => {
  const f = db.prepare("SELECT * FROM friendships WHERE id = ?").get(Number(req.params.friendshipId));
  if (!f || f.addressee_id !== req.session.userId || f.status !== "pending") {
    return res.status(400).json({ error: "Permintaan tidak valid" });
  }
  db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(f.id);
  io.to("user:" + f.requester_id).to("user:" + f.addressee_id).emit("friends:changed");
  res.json({ ok: true });
});

// Tolak permintaan / hapus teman
app.delete("/api/friends/:friendshipId", requireLogin, (req, res) => {
  const f = db.prepare("SELECT * FROM friendships WHERE id = ?").get(Number(req.params.friendshipId));
  if (!f || (f.requester_id !== req.session.userId && f.addressee_id !== req.session.userId)) {
    return res.status(400).json({ error: "Tidak valid" });
  }
  db.prepare("DELETE FROM friendships WHERE id = ?").run(f.id);
  io.to("user:" + f.requester_id).to("user:" + f.addressee_id).emit("friends:changed");
  res.json({ ok: true });
});

// ============================================================
// PESAN (riwayat, pin, search, upload)
// ============================================================
app.get("/api/messages/channel/:id", requireLogin, (req, res) => {
  const ch = H.channelForMember(Number(req.params.id), req.session.userId);
  if (!ch) return res.status(403).json({ error: "Tidak punya akses" });
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const rows = db.prepare(H.MSG_SELECT + " WHERE m.channel_id = ? AND m.id < ? ORDER BY m.id DESC LIMIT 50").all(ch.id, before);
  res.json(H.attachReactions(rows.reverse()));
});

app.get("/api/messages/dm/:otherId", requireLogin, (req, res) => {
  const otherId = Number(req.params.otherId);
  if (!H.areFriends(req.session.userId, otherId)) return res.status(403).json({ error: "Hanya bisa DM dengan teman" });
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const key = H.dmKey(req.session.userId, otherId);
  const rows = db.prepare(H.MSG_SELECT + " WHERE m.dm_key = ? AND m.id < ? ORDER BY m.id DESC LIMIT 50").all(key, before);
  res.json(H.attachReactions(rows.reverse()));
});

app.get("/api/messages/pinned/:channelId", requireLogin, (req, res) => {
  const ch = H.channelForMember(Number(req.params.channelId), req.session.userId);
  if (!ch) return res.status(403).json({ error: "Tidak punya akses" });
  const rows = db.prepare(H.MSG_SELECT + " WHERE m.channel_id = ? AND m.pinned = 1 ORDER BY m.id DESC").all(ch.id);
  res.json(H.attachReactions(rows));
});

app.get("/api/search", requireLogin, (req, res) => {
  const q = (req.query.q || "").trim();
  const ch = H.channelForMember(Number(req.query.channel), req.session.userId);
  if (!q || !ch) return res.json([]);
  const rows = db.prepare(H.MSG_SELECT + " WHERE m.channel_id = ? AND m.content LIKE ? ORDER BY m.id DESC LIMIT 30").all(ch.id, `%${q}%`);
  res.json(H.attachReactions(rows));
});

app.post("/api/upload", requireLogin, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file" });
  res.json({ url: "/uploads/" + req.file.filename, name: req.file.originalname });
});

// ============================================================
// SOCKET.IO
// ============================================================
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const sess = socket.request.session;
  if (!sess || !sess.userId) return socket.disconnect();
  const userId = sess.userId;
  const username = sess.username;

  onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
  io.emit("presence", [...onlineUsers.keys()]);
  socket.join("user:" + userId);

  // Join room semua branch yang diikuti (untuk event branch-level)
  const myBranches = db.prepare("SELECT branch_id FROM memberships WHERE user_id = ?").all(userId);
  for (const b of myBranches) socket.join("branch:" + b.branch_id);
  socket.on("branch:subscribe", (branchId) => {
    if (H.branchRole(userId, branchId)) socket.join("branch:" + branchId);
  });

  socket.on("channel:join", (channelId) => {
    if (!H.channelForMember(channelId, userId)) return;
    [...socket.rooms].filter((r) => r.startsWith("channel:")).forEach((r) => socket.leave(r));
    socket.join("channel:" + channelId);
  });

  function broadcastMessage(event, msg) {
    if (msg.channel_id) io.to("channel:" + msg.channel_id).emit(event, msg);
    else if (msg.dm_key) {
      const [a, b] = msg.dm_key.split("-");
      io.to("user:" + a).to("user:" + b).emit(event, msg);
    }
  }

  // --- pesan channel ---
  socket.on("message:channel", ({ channelId, content, fileUrl, fileName, replyTo }) => {
    if (!content && !fileUrl) return;
    const ch = H.channelForMember(channelId, userId);
    if (!ch || ch.type === "voice") return;
    // Announce channel: hanya staff yang boleh kirim
    if (ch.type === "announce" && !H.isBranchStaff(userId, ch.branch_id)) return;
    const r = db.prepare(
      "INSERT INTO messages (channel_id, user_id, content, file_url, file_name, reply_to) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(channelId, userId, content || null, fileUrl || null, fileName || null, replyTo || null);
    const msg = H.getMessage(Number(r.lastInsertRowid));
    io.to("channel:" + channelId).emit("message:channel", msg);
    io.to("branch:" + ch.branch_id).emit("activity", { type: "channel", id: channelId, branchId: ch.branch_id, from: userId, mentions: extractMentions(content) });
  });

  // --- pesan DM (hanya antar teman) ---
  socket.on("message:dm", ({ toUserId, content, fileUrl, fileName, replyTo }) => {
    if (!content && !fileUrl) return;
    if (!H.areFriends(userId, toUserId)) return;
    const key = H.dmKey(userId, toUserId);
    const r = db.prepare(
      "INSERT INTO messages (dm_key, user_id, content, file_url, file_name, reply_to) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(key, userId, content || null, fileUrl || null, fileName || null, replyTo || null);
    const msg = H.getMessage(Number(r.lastInsertRowid));
    io.to("user:" + userId).to("user:" + toUserId).emit("message:dm", msg);
    io.to("user:" + toUserId).emit("activity", { type: "dm", id: userId, from: userId });
  });

  // --- edit (pemilik saja) ---
  socket.on("message:edit", ({ messageId, content }) => {
    const m = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId);
    if (!m || m.user_id !== userId || !content) return;
    db.prepare("UPDATE messages SET content = ?, edited = 1 WHERE id = ?").run(content, messageId);
    broadcastMessage("message:updated", H.getMessage(messageId));
  });

  // --- hapus permanen (pemilik atau staff branch) ---
  socket.on("message:delete", ({ messageId }) => {
    const m = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId);
    if (!m) return;
    let allowed = m.user_id === userId;
    if (!allowed && m.channel_id) {
      const ch = db.prepare("SELECT * FROM channels WHERE id = ?").get(m.channel_id);
      allowed = ch && H.isBranchStaff(userId, ch.branch_id);
    }
    if (!allowed) return;
    if (m.file_url) {
      const p = path.join(UPLOAD_DIR, path.basename(m.file_url));
      fs.unlink(p, () => {});
    }
    db.prepare("DELETE FROM reactions WHERE message_id = ?").run(messageId);
    db.prepare("DELETE FROM messages WHERE id = ?").run(messageId);
    const info = { id: messageId };
    if (m.channel_id) io.to("channel:" + m.channel_id).emit("message:deleted", info);
    else if (m.dm_key) {
      const [a, b] = m.dm_key.split("-");
      io.to("user:" + a).to("user:" + b).emit("message:deleted", info);
    }
    const replies = db.prepare("SELECT id FROM messages WHERE reply_to = ?").all(messageId);
    for (const r of replies) broadcastMessage("message:updated", H.getMessage(r.id));
  });

  // --- reaksi ---
  socket.on("message:react", ({ messageId, emoji }) => {
    if (!emoji || emoji.length > 8) return;
    const exists = db.prepare("SELECT 1 FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?").get(messageId, userId, emoji);
    if (exists) db.prepare("DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?").run(messageId, userId, emoji);
    else db.prepare("INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)").run(messageId, userId, emoji);
    broadcastMessage("message:updated", H.getMessage(messageId));
  });

  // --- pin (staff branch) ---
  socket.on("message:pin", ({ messageId }) => {
    const m = db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId);
    if (!m || !m.channel_id) return;
    const ch = db.prepare("SELECT * FROM channels WHERE id = ?").get(m.channel_id);
    if (!ch || !H.isBranchStaff(userId, ch.branch_id)) return;
    db.prepare("UPDATE messages SET pinned = ? WHERE id = ?").run(m.pinned ? 0 : 1, messageId);
    broadcastMessage("message:updated", H.getMessage(messageId));
  });

  socket.on("typing", ({ channelId }) => {
    socket.to("channel:" + channelId).emit("typing", { username });
  });

  socket.on("disconnect", () => {
    const n = (onlineUsers.get(userId) || 1) - 1;
    if (n <= 0) onlineUsers.delete(userId);
    else onlineUsers.set(userId, n);
    io.emit("presence", [...onlineUsers.keys()]);
  });
});

function extractMentions(content) {
  if (!content) return [];
  const names = [...content.matchAll(/@(\w+)/g)].map((m) => m[1]);
  const ids = [];
  const stmt = db.prepare("SELECT id FROM users WHERE username = ?");
  for (const n of names) {
    const u = stmt.get(n);
    if (u) ids.push(u.id);
  }
  return ids;
}

// ---------- SERVE CLIENT (hasil build React) ----------
const CLIENT_DIST = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback: semua route non-API diarahkan ke index.html
  app.get(/^(?!\/(api|uploads|socket\.io)).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Brancher berjalan di http://localhost:${PORT}`);
});
