# Brancher - Deployment Produksi

Panduan deploy produksi. Untuk akses LAN/dev (Tailscale, IP lokal),
lihat `NETWORK.md`, `TAILSCALE.md`, dan `QUICK-START-NETWORK.md` —
tidak diulang di sini.

## 1. Environment variables

Salin dari `.env.example`. Wajib di produksi:

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=<teks-acak-minimal-32-karakter>
DATA_DIR=/data
```

`NODE_ENV=production` mengaktifkan secure cookie & trust proxy.
Tanpa HTTPS, cookie secure tidak terkirim — jadi HTTPS wajib (lihat bagian 4).

## 2. Docker

```bash
docker build -t brancher .
docker run -d --name brancher \
  -p 3000:3000 \
  -e SESSION_SECRET="<isi-secret>" \
  -v brancher-data:/data \
  brancher
```

Catatan:

- `client/dist/` di-build saat image dibuat; server menyajikan frontend statis.
- Jangan mount seluruh repo ke `/app` — menimpa hasil build.
- `.dockerignore` sudah mengecualikan `node_modules/`, `data/`, `.git`, `.env`.

## 3. Data & backup

Semua state ada di `DATA_DIR` (`/data` di container):

- `brancher.db` — database utama
- `sessions.db` — session
- `uploads/` — file upload

Backup (SQLite, server boleh tetap jalan):

```bash
docker cp brancher:/data/brancher.db ./backup-brancher.db
docker cp brancher:/data/sessions.db ./backup-sessions.db
docker cp brancher:/data/uploads ./backup-uploads
```

Restore: hentikan container, kembalikan file ke volume, jalankan lagi.
Jadwal yang disarankan: backup harian otomatis via cron/job scheduler hosting.

## 4. HTTPS (wajib produksi)

Contoh Caddy (otomatis dapat sertifikat):

```caddy
brancher.example.com {
  reverse_proxy localhost:3000
}
```

WebSocket Socket.io diteruskan otomatis oleh reverse proxy modern.
Contoh nginx manual ada di `NETWORK.md` (bagian Reverse Proxy).

## 5. Checklist rilis

- [ ] `SESSION_SECRET` acak & panjang, beda dari dev
- [ ] `NODE_ENV=production`, HTTPS aktif
- [ ] Volume `/data` persisten (cek: restart container, data tetap ada)
- [ ] `CHANGELOG.md` diperbarui, versi di `package.json` (root + client) sinkron
- [ ] CI hijau (lint + client build)
- [ ] Backup awal sudah diambil dan bisa di-restore
- [ ] Register → login → buat branch → kirim pesan → upload file dicoba manual

## 6. Batasan yang perlu diketahui

- SQLite single-writer: cukup untuk skala kecil-menengah; migrasi PostgreSQL
  direncanakan di `docs/TECHNOLOGY-RESEARCH.md` bila trafik naik.
- Satu instance per volume `/data`; jangan mount volume yang sama ke dua container tulis.
