// ============================================================
// Brancher - Database (SQLite bawaan Node.js)
// Semua data disimpan di DATA_DIR agar mudah di-mount sebagai
// volume/persistent disk saat deployment.
// ============================================================
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "brancher.db"));
db.exec("PRAGMA journal_mode = WAL"); // lebih tahan banyak koneksi

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    invite_code TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Keanggotaan user di sebuah Branch, dengan role per-Branch
  CREATE TABLE IF NOT EXISTS memberships (
    user_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',   -- owner | admin | member
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, branch_id)
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'text',     -- text | announce | voice
    position INTEGER DEFAULT 0
  );

  -- Pertemanan: requester mengirim permintaan ke addressee
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending | accepted
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(requester_id, addressee_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,           -- pesan channel
    dm_key TEXT,                  -- pesan DM: "idKecil-idBesar"
    user_id INTEGER NOT NULL,
    content TEXT,
    file_url TEXT,
    file_name TEXT,
    reply_to INTEGER,
    pinned INTEGER DEFAULT 0,
    edited INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, id);
  CREATE INDEX IF NOT EXISTS idx_messages_dm ON messages(dm_key, id);
  CREATE INDEX IF NOT EXISTS idx_channels_branch ON channels(branch_id, position, id);
  CREATE INDEX IF NOT EXISTS idx_memberships_branch ON memberships(branch_id);

  CREATE TABLE IF NOT EXISTS reactions (
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    UNIQUE(message_id, user_id, emoji)
  );
`);

module.exports = { db, DATA_DIR, UPLOAD_DIR };
