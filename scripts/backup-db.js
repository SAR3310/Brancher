// ============================================================
// Backup database Brancher (SQLite, mode WAL)
// Pakai VACUUM INTO agar salinan konsisten walau server sedang jalan.
//
// Pemakaian:
//   node scripts/backup-db.js            -> simpan ke DATA_DIR/backups
//   BACKUP_KEEP=14 node scripts/backup-db.js   -> simpan 14 salinan terakhir
// ============================================================
const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const SRC = path.join(DATA_DIR, "brancher.db");
const OUT_DIR = path.join(DATA_DIR, "backups");
const KEEP = Math.max(1, parseInt(process.env.BACKUP_KEEP || "7", 10));

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function run() {
  if (!fs.existsSync(SRC)) {
    console.error(`Database tidak ditemukan: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const dest = path.join(OUT_DIR, `brancher-${stamp()}.db`);
  const db = new DatabaseSync(SRC);
  try {
    // Nilai di-escape: tanda kutip tunggal digandakan
    db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  } finally {
    db.close();
  }

  // Cek hasil: buka salinan dan pastikan tabel users bisa dibaca
  const chk = new DatabaseSync(dest);
  try {
    const row = chk.prepare("PRAGMA integrity_check").get();
    const ok = Object.values(row)[0] === "ok";
    if (!ok) throw new Error("integrity_check gagal pada salinan");
  } finally {
    chk.close();
  }

  // Rotasi: hapus salinan lama, sisakan KEEP terbaru
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => /^brancher-\d{8}-\d{6}\.db$/.test(f))
    .sort()
    .reverse();
  for (const old of files.slice(KEEP)) fs.unlinkSync(path.join(OUT_DIR, old));

  console.log(`Backup OK: ${dest} (${fs.statSync(dest).size} bytes), disimpan ${Math.min(files.length, KEEP)} salinan`);
}

run();
