# AGENTS.md — Panduan Wajib untuk AI Coding Assistant

Dokumen ini menjadi acuan utama bagi seluruh agen pemrograman AI (Cursor, Claude Code, Windsurf, GitHub Copilot, Gemini, dll.) saat menghasilkan, memodifikasi, atau melakukan *refactoring* kode di repositori **Brancher**.

---

## 1. Identitas & Prinsip Utama Proyek

**Brancher** adalah aplikasi komunikasi *open-source* dengan dua pilar arsitektur yang tidak boleh dilanggar:
1. **Local-First & Hybrid Network:** Seluruh tampilan UI wajib membaca data langsung dari penyimpanan lokal perangkat (**IndexedDB** di Web, **SQLite** di Mobile), bukan menunggu respons jaringan. Jalur komunikasi bawaan adalah **P2P + Temporary Encrypted Relay (Zero-Retention)**, dengan **Self-Hosted Server** sebagai lapisan sinkronisasi opsional.
2. **Performa "Perangkat Kentang" (Low-End Hardware First):** Setiap keputusan teknis harus memprioritaskan jejak memori rendah, ukuran *bundle* kecil, dan eksekusi CPU yang ringan.

---

## 2. Batasan Teknis Keras (Hard Constraints)

Agen **DILARANG** melanggar aturan berikut saat menulis kode:

1. **Anggaran Bundle & Dependensi:**
   - Jaga ukuran *initial load* aplikasi web tetap di bawah **250 KB (gzipped)**.
   - **DILARANG** menambahkan *library* UI berat (seperti Material UI, Ant Design, Framer Motion, atau pustaka animasi berbasis fisika). Gunakan CSS utilitas ringan (Tailwind CSS) dan transisi CSS standar minimal.
   - Hindari *utility library* besar (seperti Lodash penuh atau Moment.js); gunakan API bawaan browser/TypeScript (`Intl`, `crypto.subtle`, `structuredClone`).
2. **Anggaran Memori & Rendering:**
   - Target konsumsi RAM aktif < **60 MB**.
   - **WAJIB** menggunakan teknik *list virtualization* (*windowing*) pada komponen daftar pesan di *Trunk* maupun *Branch* agar tidak merender ribuan elemen DOM sekaligus.
3. **Privasi & Penyimpanan Data:**
   - **DILARANG** menyimpan *plaintext* pesan DM atau grup P2P di server pusat mana pun.
   - Paket pesan yang melewati *Temporary Encrypted Relay* wajib dihapus segera setelah menerima sinyal konfirmasi `ACK` dari perangkat penerima.
   - Fitur unduh media (`image`, `video`, `file`) wajib disetel `autoDownload: false` secara bawaan.
4. **Aturan Antarmuka Branching:**
   - **Desktop (`>= 1024px`):** Gunakan tata letak **Bento Grid 3 Panel** (Daftar Ruang | *Trunk* Utama | Panel *Branch* Aktif).
   - **Mobile (`< 1024px`):** **DILARANG** merender pohon komentar menjorok ke kanan (*nested indentation tree*). Gunakan pola navigasi *drill-down* layar penuh disertai komponen *breadcrumb* di bagian atas.

---

## 3. Struktur Direktori Standar

Saat melakukan *scaffolding* atau menambahkan modul baru, ikuti struktur modular berikut:

```text
src/
├── core/
│   ├── crypto/          # Manajemen kunci E2EE, enkripsi/dekripsi payload
│   ├── db/              # Abstraksi IndexedDB / SQLite (local-first storage)
│   ├── network/
│   │   ├── p2p/         # WebRTC DataChannel & manajemen peer
│   │   ├── relay/       # Klien Temporary Encrypted Relay (store-and-forward + ACK)
│   │   └── sync/        # Protokol sinkronisasi delta Self-Hosted Server
│   └── branching/       # Resolusi pohon cabang, perhitungan jumlah balasan, & breadcrumb
├── ui/
│   ├── layout/          # BentoGridDesktop.tsx & DrillDownMobile.tsx
│   ├── components/      # Komponen atomik ringan tanpa dependensi berat
│   └── virtual-list/    # Virtual scroller khusus gelembung pesan
└── types/
    └── schema.ts        # Definisi tipe BrancherMessage, BranchMetadata, RoomConfig
```

---

## 4. Konvensi Penulisan Kode

- **Bahasa:** Gunakan **TypeScript** dengan mode `strict: true`. Hindari penggunaan tipe `any`.
- **ID & Pengurutan:** Gunakan **UUIDv7** untuk `messageId` sehingga pengurutan kronologis dapat dilakukan secara leksikografis tanpa beban komputasi tambahan.
- **Struktur Data Datar:** Simpan seluruh pesan dalam satu tabel/store datar menggunakan relasi `roomId`, `branchId`, dan `parentMessageId`. Jangan menyimpan array bersarang (*deeply nested JSON*) di dalam database lokal karena akan memperlambat proses baca/tulis pada perangkat lawas.
- **Komentar Kode:** Tulis komentar ringkas yang menjelaskan *mengapa* suatu optimasi atau alur kriptografi dilakukan, terutama pada bagian WebRTC dan sinkronisasi *offline*.

---

## 5. Checklist Verifikasi Sebelum Menyelesaikan Tugas

Sebelum mengakhiri sesi pembuatan kode, agen wajib memastikan:
- [ ] Tidak ada *blocking network call* sebelum UI merender data lokal.
- [ ] Komponen daftar pesan mendukung virtualisasi dan tidak memicu *re-render* seluruh daftar saat satu pesan baru masuk.
- [ ] Tampilan responsif telah teruji secara logika untuk mode 3-panel Desktop dan mode *drill-down* Mobile.
- [ ] Tidak ada dependensi baru yang membengkakkan ukuran *bundle*.