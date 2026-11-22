# Product Requirements Document (PRD): Brancher

- **Versi Dokumen:** 1.0 (Baseline MVP)
- **Status:** Siap Implementasi Teknis
- **Lisensi:** Open-Source (MIT / Apache-2.0)
- **Repositori:** `https://github.com/SAR3310/Brancher`
- **Target Platform:** Web (Desktop & Mobile Responsive) serta Mobile App

---

## 1. Ringkasan Eksekutif & Latar Belakang Masalah

**Brancher** adalah aplikasi komunikasi *open-source* yang ringan, interaktif, dan ramah pengguna untuk kebutuhan *chatting*, berbagi media, hingga diskusi komunitas berskala besar.

Platform komunikasi populer saat ini memaksa pengguna menerima kompromi arsitektur yang membatasi:

1. **Model Terpusat Penuh (Discord):** Mendukung manajemen server dan komunitas besar, tetapi seluruh riwayat pesan, gambar, dan *thread* disimpan secara permanen di server milik perusahaan penyedia layanan.
2. **Model P2P Linear (WhatsApp):** Menjaga privasi melalui enkripsi *end-to-end* (E2EE) dan penyimpanan lokal di perangkat pengguna tanpa membebani server, tetapi alur obrolan yang menumpuk lurus ke bawah membuat diskusi multi-topik cepat tenggelam.
3. **Model Cloud Hybrid (Telegram):** Mendukung grup dan *channel* berkapasitas besar, tetapi enkripsi *end-to-end* tidak aktif secara bawaan untuk seluruh ruang diskusi.

**Solusi Brancher:** Menggabungkan kecepatan dan privasi *peer-to-peer* (P2P) terenkripsi dengan opsi *self-hosted server* mandiri, serta mengganti alur obrolan linear dengan sistem percakapan bercabang (**Topic Branching**) yang dirancang tetap ringan pada perangkat berspesifikasi rendah (*perangkat kentang*).

---

## 2. Visi & Target Pengguna

- **Visi Produk:** Menghadirkan ruang komunikasi harian dan kolaborasi komunitas yang cepat, hemat sumber daya, menghormati kepemilikan data pengguna, dan bebas dari kekacauan topik bertumpuk.
- **Segmen Pengguna:**
  - **Pengguna Pribadi & Kelompok Kecil:** Membutuhkan DM, grup, dan panggilan yang privat tanpa riwayat obrolan tersimpan di server luar.
  - **Komunitas & Organisasi:** Membutuhkan diskusi terstruktur dengan banyak sub-topik serta opsi menjalankan server sendiri (*self-hosted*) untuk menyimpan arsip jangka panjang.
  - **Pengguna Perangkat Lawas / Koneksi Terbatas:** Membutuhkan aplikasi web/mobile yang hemat RAM, hemat kuota, dan tidak mengunduh media secara otomatis.

---

## 3. Arsitektur Jaringan Hybrid

Brancher memisahkan jalur pengiriman dan penyimpanan data ke dalam tiga mekanisme utama:

### 3.1 Jalur Utama P2P-First (DM, Grup, Channel, & Panggilan)
- Secara bawaan, pertukaran pesan pada DM, grup, maupun *channel* berjalan langsung antar-perangkat (*peer-to-peer*) menggunakan WebRTC DataChannels dengan enkripsi *end-to-end* (E2EE).
- Riwayat obrolan disimpan secara lokal di perangkat masing-masing anggota (*local-first*) sehingga tidak membebani infrastruktur server pusat.

### 3.2 Temporary Encrypted Relay (Penanganan Penerima Offline)
- Jika penerima atau sebagian anggota grup sedang *offline* saat pesan dikirim, paket pesan yang sudah terenkripsi E2EE dititipkan sementara di node *relay*.
- Server *relay* hanya menyimpan *ciphertext* dan metadata perutean minimal tanpa kunci dekripsi.
- Begitu perangkat penerima kembali *online* dan mengirimkan konfirmasi penerimaan (`ACK`), pesan langsung dihapus permanen dari server *relay* (kebijakan *zero-retention*).

### 3.3 Mode Self-Hosted Server (Opsional untuk Komunitas/Organisasi)
- Administrator komunitas atau perusahaan dapat menjalankan server mandiri untuk menyimpan riwayat permanen dari grup, *channel*, *post*, dan *thread* agar tidak membebani penyimpanan ponsel anggota.
- Anggota yang baru bergabung atau baru kembali *online* otomatis melakukan sinkronisasi delta riwayat terbaru langsung dari server komunitas tersebut.

---

## 4. Desain Pengalaman Pengguna (UX) & Alur Branching

Antarmuka mengusung tata letak modular bergaya **Bento Grid** dengan kontras tinggi (latar gelap pekat, aksen biru teknologi, teks putih bersih, dan aksen hijau elektrik untuk penanda cabang aktif) agar hemat daya dan mudah dipindai.

### 4.1 Tampilan Desktop / Web (3 Panel Sejajar)
1. **Panel Kiri (Navigasi Ruang):** Daftar DM, grup, *channel*, dan server dengan lencana indikator jaringan (`[P2P]` atau `[SRV]`).
2. **Panel Tengah (Trunk / Obrolan Utama):** Alur percakapan utama. Pesan yang memiliki diskusi lanjutan menampilkan lencana jumlah cabang (contoh: `↳ 2 Cabang Diskusi`).
3. **Panel Kanan (Active Branch):** Terbuka berdampingan saat lencana cabang diklik, memungkinkan pengguna membalas di dalam cabang tanpa kehilangan konteks obrolan utama.

### 4.2 Tampilan Ponsel (Mode Drill-Down & Breadcrumb)
- Menghindari tampilan menjorok ke kanan (*nested tree*) agar lebar teks tidak menyempit di layar ponsel.
- Mengetuk lencana cabang akan menggeser layar penuh masuk ke ruang cabang tersebut, dilengkapi navigasi *breadcrumb* di bagian atas (contoh: `← Utama › Desain UI › Palet Warna`) serta cuplikan ringkas pesan induk sebagai pengingat konteks.

---

## 5. Model Data Inti (Core Data Structure)

Untuk menjaga konsistensi sinkronisasi antara jalur P2P, *Temporary Relay*, dan *Self-Hosted Server*, setiap pesan menggunakan struktur relasional datar (*flat relational structure*):

```typescript
export interface BrancherMessage {
  id: string;                     // UUIDv7 (berurutan secara kronologis)
  roomId: string;                 // ID DM, Grup, atau Channel
  branchId: string | null;        // null = Obrolan Utama (Trunk), string = ID Cabang aktif
  parentMessageId: string | null; // ID pesan pemicu jika pesan ini memulai cabang baru
  senderId: string;               // Public Key / identitas kriptografis pengirim
  ciphertext: string;             // Payload pesan terenkripsi E2EE
  mediaMeta?: {
    type: 'image' | 'video' | 'file';
    mimeType: string;
    sizeBytes: number;
    hash: string;                 // SHA-256 untuk verifikasi integritas file P2P
    autoDownload: false;          // Wajib false secara default demi hemat kuota & RAM
  };
  timestamp: number;              // Unix timestamp dalam milidetik
}

export interface BranchMetadata {
  branchId: string;
  roomId: string;
  rootMessageId: string;          // Pesan tempat cabang pertama kali ditarik
  parentBranchId: string | null;  // null jika cabang langsung dari Trunk
  title: string;                  // Judul singkat topik cabang
  replyCount: number;
  lastActivityAt: number;
}
```

---

## 6. Kebutuhan Fungsional (User Stories & Acceptance Criteria)

| Prioritas | Fitur | User Story | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **P0** | **Topic Branching** | Sebagai peserta diskusi, saya ingin menarik pesan tertentu menjadi cabang baru agar pembahasan spesifik tidak menumpuk di ruang utama. | - Setiap pesan memiliki aksi **Buat Cabang**.<br>- Cabang dapat memiliki sub-cabang bertingkat tanpa batas kedalaman struktur data.<br>- Navigasi *breadcrumb* dapat melompat ke level mana pun dalam 1 klik/ketukan. |
| **P0** | **P2P Chat & Temp Relay** | Sebagai pengguna, saya ingin pesan P2P tetap terkirim meskipun teman saya sedang *offline*, tanpa riwayat chat disimpan permanen di server luar. | - Koneksi langsung via WebRTC DataChannel jika kedua pihak *online*.<br>- Jika penerima *offline*, *ciphertext* masuk ke antrean *Temporary Relay* dan terhapus otomatis setelah `ACK` diterima. |
| **P0** | **Self-Hosted Sync** | Sebagai admin komunitas, saya ingin menyambungkan ruang diskusi ke server sendiri agar anggota baru bisa membaca arsip *thread* lama. | - Klien dapat menambahkan alamat server mandiri via URL/token undangan.<br>- Sinkronisasi delta hanya menarik pesan dengan `timestamp` lebih baru dari data lokal terakhir. |
| **P1** | **Media Lazy-Loading** | Sebagai pengguna perangkat berspesifikasi rendah, saya ingin gambar dan video tidak terunduh otomatis agar RAM dan penyimpanan tidak penuh. | - Media tampil sebagai *placeholder* ringan berisi nama dan ukuran file.<br>- File baru ditarik lewat P2P atau server saat pengguna mengetuk tombol unduh. |
| **P1** | **Status P2P 24 Jam** | Sebagai pengguna, saya ingin membagikan pembaruan status singkat ke kontak P2P saya. | - Status dikirim langsung ke kontak aktif dan kedaluwarsa otomatis setelah 24 jam dari penyimpanan lokal. |

---

## 7. Kebutuhan Non-Fungsional (Standar Performa & Keamanan)

1. **Anggaran Sumber Daya ("Perangkat Kentang"):**
   - Konsumsi RAM aktif di browser maupun ponsel wajib dijaga di bawah **60 MB** untuk sesi obrolan teks standar.
   - Ukuran *initial bundle* aplikasi web (gzipped) maksimal **250 KB**.
   - Dilarang menggunakan animasi berat berbasis *blur/backdrop-filter* berlapis atau pemrosesan GPU berlebihan.
2. **Penyimpanan Lokal Cepat (*Local-First*):**
   - Menggunakan **IndexedDB** (Web) dan **SQLite** (Mobile) sebagai sumber kebenaran utama (*single source of truth*) antarmuka.
   - Daftar pesan wajib menerapkan *windowing / virtualization* (hanya merender 20–30 gelembung pesan di sekitar area pandang layar).
3. **Privasi & Kriptografi:**
   - Enkripsi *end-to-end* aktif secara bawaan pada seluruh komunikasi P2P sehingga operator *Temporary Encrypted Relay* tidak memiliki akses ke isi pesan maupun judul cabang.

---

## 8. Roadmap Pengembangan

- **Fase 1 — MVP (Fondasi Lokal & Topic Branching):**
  - Antarmuka Bento Grid (Desktop) & Drill-Down Breadcrumb (Mobile).
  - Penyimpanan lokal IndexedDB + virtualisasi daftar pesan.
  - Fitur *Topic Branching* multi-level.
  - Pertukaran pesan teks P2P (WebRTC) + *Temporary Encrypted Relay*.
- **Fase 2 — Self-Hosted Server & Media:**
  - Paket server mandiri siap pakai (*Dockerized*) untuk komunitas.
  - Sinkronisasi delta riwayat grup, *channel*, *post*, dan *thread*.
  - Transfer media dengan *lazy-loading* dan verifikasi hash SHA-256.
- **Fase 3 — Real-Time Audio/Video & Ekosistem:**
  - Panggilan suara dan video P2P.
  - Fitur Status 24 jam P2P.
  - Dokumentasi API dan SDK terbuka untuk kontributor *open-source*.