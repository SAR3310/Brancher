# 🌿 Brancher

**Aplikasi komunikasi *open-source* yang ringan, interaktif, ramah pengguna, dan terstruktur dengan percakapan bercabang (*Topic Branching*).**

Brancher memadukan privasi dan efisiensi jalur **Peer-to-Peer (P2P)** ala WhatsApp, fleksibilitas server komunitas ala Discord & Telegram, serta mekanisme diskusi bercabang agar percakapan penting tidak pernah tenggelam di dalam satu ruang obrolan yang ramai.

---

## ✨ Mengapa Brancher?

- **🌿 Percakapan Bercabang (*Topic Branching*):** Tarik pesan mana pun menjadi cabang diskusi baru (dan sub-cabang di dalamnya) tanpa mengotori obrolan utama (*Trunk*).
- **🔒 P2P-First + End-to-End Encrypted:** DM, grup, dan *channel* berjalan langsung antar-perangkat dengan penyimpanan lokal (*local-first*).
- **⚡ Temporary Encrypted Relay:** Penerima sedang *offline*? Pesan terenkripsi dititipkan sementara di *relay* dan langsung dihapus otomatis begitu terkirim (*zero-retention*).
- **🖥️ Self-Hosted Server (Opsional):** Komunitas atau organisasi dapat menjalankan server mandiri untuk menyimpan arsip *group chat*, *channel*, *post*, dan *thread* jangka panjang.
- **🪶 Ramah Perangkat Kentang:** Dirancang dengan target konsumsi RAM di bawah **60 MB**, *bundle* awal di bawah **250 KB (gzipped)**, *virtualized list*, dan *lazy-loading* media.

---

## 🖥️ Gambaran Antarmuka

### Desktop / Web (Tata Letak Bento Modular 3 Panel)
```text
+--------------------+---------------------------------+---------------------------------+
|   RUANG & SERVER   |       OBROLAN UTAMA (TRUNK)     |     PANEL CABANG (BRANCH)       |
+--------------------+---------------------------------+---------------------------------+
| [P2P] DM: Budi     | Budi (10:01)                    | < Kembali | Utama > Desain UI   |
| [P2P] Grup Kelas   | Guys, tugas proyek dikumpul     |---------------------------------|
| [SRV] Komunitas IT | besok. Ada yang sudah kelar?    | Rani (10:03)                    |
|                    |   └─ [↳ 2 Cabang Diskusi]       | Pakai warna gelap aja biar      |
|                    |                                 | hemat baterai.                  |
|                    | Andi (10:02)                    |   └─ [↳ 1 Sub-Cabang: Palet]    |
|                    | Aman, tinggal bagian desain.    |                                 |
+--------------------+---------------------------------+---------------------------------+
```

### Ponsel (Mode Drill-Down & Breadcrumb)
Pada layar kecil, Brancher menghindari komentar menjorok ke kanan (*nested tree*) agar teks tetap lebar dan mudah dibaca, menggantinya dengan navigasi geser penuh dan jalur *breadcrumb* (`← Utama › Desain UI › Palet`).

---

## 📚 Dokumentasi Proyek

- [`PRD.md`](./PRD.md) — Spesifikasi kebutuhan produk, alur pengguna, model data, dan *roadmap* MVP.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Rancangan teknis jaringan *hybrid* (WebRTC, *Temporary Relay*, *Self-Hosted Sync*, dan skema penyimpanan lokal).
- [`AGENTS.md`](./AGENTS.md) — Panduan dan batasan arsitektur wajib bagi AI *coding assistant* (Cursor, Claude Code, Copilot, Windsurf).
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Panduan kontribusi kode, standar performa, dan alur *Pull Request*.

---

## 🗺️ Status & Roadmap

- [x] Perumusan konsep arsitektur *Hybrid P2P + Self-Hosted*
- [x] Finalisasi PRD v1.0 & desain antarmuka Desktop/Mobile
- [ ] **Fase 1 (MVP):** Fondasi penyimpanan lokal (IndexedDB), *Topic Branching* multi-level, & P2P Text + *Temporary Relay*
- [ ] **Fase 2:** Paket *Self-Hosted Server* (Docker) & *lazy-loading* transfer media
- [ ] **Fase 3:** Panggilan suara/video P2P & pembaruan Status 24 jam

---

## 🤝 Ikut Berkontribusi

Brancher adalah proyek *open-source* yang masih berada pada tahap awal pengembangan. Baca [`CONTRIBUTING.md`](./CONTRIBUTING.md) dan [`PRD.md`](./PRD.md) untuk mulai mengambil bagian pada modul Fase 1.