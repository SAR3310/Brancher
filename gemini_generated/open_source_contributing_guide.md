# Panduan Berkontribusi di Brancher

Terima kasih telah tertarik membantu membangun **Brancher**! Karena proyek ini bersifat *open-source* dan dirancang agar berjalan ringan di berbagai perangkat, kami menjaga standar kontribusi yang jelas dan terstruktur.

---

## 1. Fokus Kontribusi Saat Ini (Fase 1 — MVP)

Jika kamu baru pertama kali melihat repositori ini, berikut area prioritas yang paling membutuhkan kontribusi:
1. **Lapisan Penyimpanan Lokal (`src/core/db`):** Implementasi wrapper ringan IndexedDB dengan dukungan indeks majemuk (`[roomId, branchId, timestamp]`).
2. **Engine Topic Branching (`src/core/branching`):** Logika pembuatan cabang baru dari pesan, pembaruan penghitung balasan (`replyCount`), dan generator jalur *breadcrumb*.
3. **Komponen UI Ringan (`src/ui`):** Implementasi *Bento Grid 3 Panel* untuk desktop, tampilan *Drill-Down* untuk mobile, serta *virtualized message list*.
4. **Koneksi P2P & Temporary Relay (`src/core/network`):** Protokol pertukaran sinyal WebRTC dan antrean *relay* sementara dengan mekanisme penghapusan `ACK`.

---

## 2. Alur Kerja Git

1. **Fork** repositori `https://github.com/SAR3310/Brancher`.
2. Buat *branch* baru dari `main` dengan penamaan yang deskriptif:
   - `feat/nama-fitur` (contoh: `feat/breadcrumb-navigation`)
   - `fix/nama-bug` (contoh: `fix/webrtc-reconnect-loop`)
   - `perf/nama-optimasi` (contoh: `perf/virtual-list-memory`)
   - `docs/nama-dokumen` (contoh: `docs/update-architecture`)
3. Pastikan setiap *commit* menggunakan pesan yang ringkas dan jelas (disarankan mengikuti standar *Conventional Commits*).
4. Ajukan **Pull Request (PR)** ke branch `main` dengan menjelaskan perubahan yang dilakukan serta hasil pengujiannya.

---

## 3. Aturan Emas Sebelum Mengajukan Pull Request

Setiap kode yang masuk ke Brancher wajib lolos pemeriksaan mandiri berikut:

- **Cek Ukuran Bundle:** Pastikan penambahan kode tidak mendorong ukuran *initial load* melewati batas **250 KB (gzipped)**.
- **Tanpa Dependensi Berat:** Jangan menambahkan pustaka eksternal besar jika fungsinya bisa ditulis dalam puluhan baris TypeScript murni.
- **Uji Layar Kecil & Desktop:** Pastikan komponen baru tetap rapi pada lebar layar ponsel (`360px`) maupun layar desktop (`1280px+`).
- **Jaga Privasi & Local-First:** Pastikan fitur baru tetap mengutamakan pembacaan data dari penyimpanan lokal dan tidak membocorkan metadata sensitif ke server pihak ketiga.

---

## 4. Pelaporan Bug & Usulan Fitur

- Gunakan tab **Issues** di GitHub untuk melaporkan *bug* atau mengusulkan peningkatan fitur.
- Untuk laporan *bug*, sertakan spesifikasi perangkat/browser yang digunakan agar tim dapat mereproduksi masalah performa terutama pada perangkat berspesifikasi rendah.