# Arsitektur Teknis: Brancher

Dokumen ini menjelaskan desain sistem tingkat rendah untuk **Brancher**, mencakup topologi jaringan *hybrid*, alur enkripsi *end-to-end* (E2EE), penyimpanan lokal, dan resolusi struktur percakapan bercabang.

---

## 1. Diagram Topologi Jaringan Hybrid

```text
                       +-----------------------------------+
                       |   Signaling & Discovery Node      |
                       |  (SDP Exchange / ICE Candidates)  |
                       +-----------------+-----------------+
                                         |
                 +-----------------------+-----------------------+
                 | (1) Direct P2P (WebRTC DataChannel)           |
                 v                                               v
        +-----------------+                             +-----------------+
        |   Klien A       | <=========================> |   Klien B       |
        | (Local DB + UI) |   E2EE Ciphertext Stream    | (Local DB + UI) |
        +--------+--------+                             +--------+--------+
                 |                                               ^
                 | (2) Jika Klien B Offline                      | (3) Tarik & Kirim ACK
                 v                                               |
        +--------------------------------------------------------+--------+
        |                 Temporary Encrypted Relay                       |
        |       (Antrean Ciphertext Sementara — Zero-Retention)           |
        +-----------------------------------------------------------------+

        +-----------------------------------------------------------------+
        |              Self-Hosted Community Server (Opsional)            |
        |   (Arsip Permanen Grup/Channel/Thread & Delta Sync Engine)      |
        +-----------------------------------------------------------------+
```

---

## 2. Alur Pengiriman Pesan (Hybrid Routing)

Setiap ruang obrolan (`roomId`) memiliki konfigurasi mode jaringan: `mode: 'p2p' | 'self-hosted'`.

### 2.1 Alur Mode P2P (`DM`, `Grup P2P`, `Channel P2P`)
1. **Enkripsi Lokal:** Klien A mengenkripsi konten pesan menjadi `ciphertext` menggunakan kunci sesi ruang obrolan sebelum menyentuh lapisan jaringan.
2. **Simpan Lokal Instan:** Pesan langsung ditulis ke penyimpanan lokal Klien A dan dirender di antarmuka (*optimistic UI*).
3. **Deteksi Kehadiran Peer:**
   - **Jika Peer Online:** Pesan dikirim langsung melalui **WebRTC DataChannel**. Klien B menerima, mendekripsi, menyimpan ke database lokal, lalu membalas dengan paket `ACK`.
   - **Jika Peer Offline:** Klien A mengirimkan paket terenkripsi ke **Temporary Encrypted Relay** dengan penanda `recipientId` dan `ttl` (masa kedaluwarsa maksimal, misalnya 7 hari).
4. **Pembersihan Relay (Zero-Retention):** Saat Klien B kembali *online*, klien otomatis mengunduh seluruh paket tertunda dari *relay*. Setelah penyimpanan lokal Klien B sukses melakukan `commit`, Klien B mengirim sinyal `ACK` ke *relay* yang memicu penghapusan baris data secara permanen (`DELETE`).

### 2.2 Alur Mode Self-Hosted (`Server Komunitas / Organisasi`)
1. Administrator menjalankan *instance* server Brancher di infrastruktur mereka sendiri.
2. Klien terhubung melalui koneksi WebSocket/HTTPS terenkripsi ke endpoint server mandiri tersebut.
3. **Delta Sync Protocol:** Saat klien membuka ruang atau baru terhubung kembali, klien mengirim `lastSyncedTimestamp`. Server hanya mengembalikan daftar pesan dan metadata cabang yang memiliki `timestamp > lastSyncedTimestamp`.

---

## 3. Desain Penyimpanan Lokal (Local-First Storage)

Untuk menjamin kecepatan akses di perangkat berspesifikasi rendah, database lokal (IndexedDB di Web / SQLite di Mobile) diindeks menggunakan skema datar berikut:

- **Store `rooms`:** Menyimpan daftar DM, grup, dan server beserta mode koneksi dan `lastSyncedTimestamp`.
- **Store `messages`:**
  - *Primary Key:* `id` (UUIDv7)
  - *Compound Index 1:* `[roomId, branchId, timestamp]` — Mempercepat pengambilan pesan untuk satu ruang atau satu cabang tertentu secara berurutan tanpa memindai seluruh database.
  - *Compound Index 2:* `[roomId, parentMessageId]` — Mempercepat deteksi apakah suatu pesan memiliki cabang turunan.
- **Store `branches`:** Menyimpan ringkasan metadata cabang (`branchId`, `title`, `replyCount`, `lastActivityAt`) agar lencana jumlah balasan pada *Trunk* dapat ditampilkan instan tanpa menghitung ulang baris pesan setiap kali layar dibuka.

---

## 4. Resolusi Navigasi Branching & Breadcrumb

Karena setiap `BranchMetadata` menyimpan `parentBranchId` dan `rootMessageId`, aplikasi dapat membangun jalur *breadcrumb* secara rekursif ke atas dalam waktu $O(d)$ di mana $d$ adalah kedalaman cabang saat ini:

1. Pengguna membuka cabang $B_3$.
2. Sistem membaca `B_3.parentBranchId` $\rightarrow$ menemukan $B_2$.
3. Sistem membaca `B_2.parentBranchId` $\rightarrow$ menemukan $B_1$.
4. Sistem membaca `B_1.parentBranchId` $\rightarrow$ bernilai `null` (berarti berasal langsung dari *Trunk* Utama).
5. Hasil urutan navigasi yang dirender di bagian atas layar ponsel: `Utama › B1 › B2 › B3`.

Pendekatan rantai induk (*parent-pointer chain*) ini menjaga biaya komputasi tetap konstan dan ringan meskipun sebuah diskusi memiliki ratusan cabang paralel.

---

## 5. Strategi Optimasi Perangkat Kentang

- **Zero-Copy Worker Offloading:** Proses enkripsi/dekripsi kriptografi dan pembacaan IndexedDB dijalankan di dalam **Web Worker** terpisah agar *main thread* UI selalu responsif pada 60 FPS saat pengguna melakukan *scrolling*.
- **Chunked P2P File Transfer:** File media yang diunduh secara manual dipecah menjadi potongan kecil (*chunks* berukuran 16 KB – 64 KB) melalui WebRTC DataChannel agar tidak memicu lonjakan penggunaan RAM pada browser ponsel.