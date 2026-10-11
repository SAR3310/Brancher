# Brancher — Visi & Arah Proyek

> **Status**: Dokumen hidup (brainstorming → keputusan). Terakhir diperbarui: 2026-10-11.
> Catatan: dokumen ini berisi **keputusan desain**, bukan janji fitur yang sudah ada.
> Kode saat ini belum menerapkan sebagian besar hal di bawah.

---

## Deskripsi

Brancher adalah aplikasi komunikasi yang ringan, interaktif, dan ramah pengguna untuk skala besar — dari pribadi, kelompok kecil, komunitas, perusahaan, hingga global.

Perpaduan WhatsApp dan Discord:
- Dari **WhatsApp**: DM, status, dan channel yang mudah dipakai.
- Dari **Discord**: konsep *branching* — satu topik tidak berhenti, tapi bisa terus bercabang menciptakan topik baru.
- Dirancang agar tetap optimal tanpa membebani server.

## Visi

Komunikasi yang **bebas dan ringan di semua skala**. Percakapan tidak berhenti — terus bercabang. Setiap orang bebas memilih: cukup memakai DM-nya, atau menjalankan server komunitasnya sendiri.

## Misi

1. **Ringan & ramah pengguna** — aplikasi komunikasi yang interaktif dan mudah dipakai siapa pun.
2. **Federasi** — siapa pun bisa self-host server untuk channel/grup komunitasnya sendiri. Server pusat hanya menangani **login dan backup**.
3. **Open source** — dikembangkan terbuka di GitHub untuk mengundang kontribusi.
4. **Siap skala besar** — fondasi disiapkan sejak awal agar siap digeber; optimasi dilakukan sambil jalan.

## Target (bertahap)

| Fase | Fokus | Kriteria |
|------|-------|----------|
| **1 — Sekolah** | Pengguna nyata pertama (sekolah sendiri) | Deploy stabil, login + real-time terbukti jalan |
| **2 — Federasi** | Server komunitas mandiri saling terhubung | Node bisa saling sinkron; identitas terpusat berfungsi sebagai identity provider |
| **3 — Skala besar** | Arsitektur terbukti siap digeber | Migrasi PostgreSQL + Redis selesai; siap untuk pertumbuhan |

## Tujuan Sekarang (v0.2)

- [ ] Real-time (Socket.IO) terbukti jalan — 3 tes lama gagal, harus diverifikasi ulang.
- [ ] Login dari browser terbukti (field `identifier` baru diperbaiki, belum diverifikasi end-to-end).
- [ ] Brancher stabil di server sekolah.

---

## Keputusan Arsitektur

Keputusan yang diambil saat brainstorming 2026-10-11. Ini **arah**, bukan implementasi.

### 1. Federasi, bukan monolith

Banyak server mandiri yang saling terhubung (pola email / Matrix). Setiap komunitas bisa menjalankan servernya sendiri; server pusat hanya jadi penyedia identitas (login) dan opsi backup. Bukan satu server yang melayani semua orang.

### 2. Identitas sebagai service terpisah

Auth dibungkus jadi modul dengan API bersih (register/login/verify), terpisah dari logika aplikasi. Fase 1 tetap sentral (seperti sekarang). Fase 2 perannya berubah menjadi *identity provider* yang dipercaya server komunitas. Fase 3 bisa dibuka standalone bila perlu.

Alasan: keputusan login adalah yang paling mahal diubah belakangan. Membungkusnya sekarang murah; membongkarnya nanti mahal.

### 3. Sinkronisasi hybrid: P2P + recovery server

- Setiap pesan punya ID + hash; server komunitas menyimpan replika lengkap (arsip resmi).
- Client menyimpan cache lokal; P2P dipakai sebagai jalur cepat saat dua client online (hemat beban server).
- Cache lokal korup → terdeteksi lewat hash mismatch → tarik ulang dari server atau replika lain.
- Model ini mengikuti pola event + replika ala Matrix.

### 4. Privasi: E2EE opt-in untuk backup (fase awal)

- **Default: mati.** Enkripsi at rest + HTTPS dulu.
- User bisa mengaktifkan **Keamanan Tingkat Lanjut** → backup chat dienkripsi di sisi client; server (termasuk admin) **tidak bisa membaca**.
- Yang dikirim ke server hanya *bungkusan* master key yang tak berguna tanpa passphrase/seed user.
- **Terapkan ke backup dulu**, bukan pesan live. Backup = permukaan kecil, aman untuk belajar. Live E2EE = fase berikutnya.

### 5. Kunci & pemulihan

- Master key acak (256-bit) dibuat di device user; mengenkripsi backup dengan AES-256-GCM.
- Master key dibungkus kunci turunan dari passphrase/seed user (Argon2 untuk derivasi).
- Opsi pembuka: passphrase, seed phrase, opsional recovery code.
- MFA (TOTP) = **gerbang tambahan**, bukan kunci enkripsi itu sendiri.
- Kehilangan semua kunci → 2 pilihan: relakan data, atau berjuang memulihkan. **Tidak ada pengecualian, termasuk untuk admin.**
- **Aturan besi**: jangan bikin kripto sendiri. Pakai WebCrypto atau libsodium.

### 6. Consent flow (friction by design)

Saat mengaktifkan Keamanan Tingkat Lanjut:
1. Layar peringatan jujur (tanpa menakut-nakuti berlebihan).
2. User **mengetik persis** frasa persetujuan, misalnya:
   > `Saya mengerti kehilangan kunci berarti kehilangan seluruh data`
   Bukan checkbox. Harus diketik, bukan ditempel.
3. Baru tampilkan seed/recovery code.
4. Paksa konfirmasi "sudah kusimpan".
5. Simpan jejak persetujuan: timestamp + versi kebijakan. Kebijakan berubah → minta persetujuan ulang.

Catatan: frasa persetujuan **bukan pengaman teknis** — itu lapisan UX/hukum. Pengaman teknisnya tetap enkripsi yang benar.

### 7. Prinsip kepercayaan

User advance tidak percaya klaim — mereka percaya desain yang bisa diverifikasi. Karena itu:
- Kode terbuka (open source).
- Kripto standar yang dikenal (AES-256-GCM, X25519, Argon2), bukan algoritma buatan sendiri.
- Threat model tertulis: server lihat apa, tidak lihat apa, titik lemah di mana.
- Klaim spesifik, bukan slogan ("server hanya menyimpan ciphertext" > "keamanan tingkat militer").

---

## Batasan & Catatan Jujur

- **Kode saat ini belum federated.** Masih Express + SQLite monolith. Visi boleh besar, tapi lapisan identitas & sinkronisasi harus dipikirkan sebelum fitur menumpuk — kalau tidak, nanti harus dibongkar ulang.
- **SQLite** diperkirakan maksimal ~500 user; PostgreSQL + Redis dibutuhkan untuk fase 2 ke atas.
- Target angka (1.000 / 10.000 user) belum diuji; anggap aspirasi sampai ada data nyata.

## Keputusan yang Masih Terbuka

- [ ] Isi backup server pusat: ciphertext penuh, atau metadata saja?
- [ ] Jalur DM antar node: P2P langsung, lewat server pusat, atau antar server komunitas?
- [ ] Seberapa sakti enkripsi fase 1: cukup at-rest + HTTPS, atau langsung E2EE penuh?
- [ ] Lisensi proyek (menentukan seberapa bebas orang memakai fork).
- [ ] `CONTRIBUTING.md` sebelum membuka kontribusi publik.
