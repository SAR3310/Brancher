# Arsip dokumentasi

Folder ini berisi laporan sesi kerja, ringkasan status, dan dokumen yang sudah digantikan dari pengembangan awal Brancher.

**Jangan dijadikan sumber acuan.**

## Jenis isi arsip

1. **Laporan sesi kerja (5 Okt 2026 dan sebelumnya)** — klaim seperti "production ready", "100%", atau "Stability ✅" di sini **tidak diverifikasi ulang**. Beberapa bug yang sudah diperbaiki (backend crash saat start, login gagal karena field `identifier` vs `email`) tidak tercatat di laporan-laporan ini. Klaim soal Docker build kemungkinan juga tidak pernah diverifikasi sungguhan — sebagian laporan sendiri menyebut "DOCKER BUILD PENDING".

2. **Dokumen network lama** (`NETWORK.md`, `TAILSCALE.md`, `QUICK-START-NETWORK.md`) — digantikan oleh [`docs/NETWORKING.md`](../NETWORKING.md). IP di dalamnya sudah usang.

3. **Dokumen deployment lama** (`QUICK-START-DOCKER.md`) — digantikan oleh [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md).

## Dokumentasi aktif

Ada di `README.md`, `DEVELOPMENT.md`, `TROUBLESHOOTING.md`, dan `docs/`. Riwayat perubahan ada di `CHANGELOG.md`.
