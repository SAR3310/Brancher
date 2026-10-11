# Brancher - Testing

Dokumen ini menggantikan enam laporan tes lama (sekarang di `docs/archive/`).

## Status singkat

- Ada **tes E2E + load** di `e2e-load-test.js`. Tes ini **belum** masuk `npm test` (script `test` belum ada di `package.json`).
- Ada **unit test**: belum ada.
- Ada `runner.js` dan `test-connectivity.js` di root sebagai pendukung. Belum diverifikasi ulang untuk dokumen ini.

## Cara menjalankan tes E2E

Server harus sudah berjalan di `http://localhost:3000`.

```bash
# Terminal 1: jalankan server
npm start

# Terminal 2: jalankan tes
node e2e-load-test.js
```

Tes ini membuat user dan branch baru di database. Jalankan dengan database yang boleh diisi data tes.

## Hasil terakhir yang tercatat

Hasil di bawah diambil dari laporan lama (5 Oktober 2026). **Belum dijalankan ulang** untuk dokumen ini.

| Kategori | Hasil | Catatan |
|---|---|---|
| Autentikasi & sesi | 5/6 | Register "Alice" gagal karena user sudah ada dari run sebelumnya |
| Branch | 3/3 | |
| Pesan (Socket.IO) | 2/3 | **Kirim pesan via Socket.IO: timeout, event tidak diterima** |
| Teman / DM | 2/3 | **Kirim DM via Socket.IO: timeout, event tidak diterima** |
| Penanganan error | 7/7 | |

Total tercatat: **18/21 lulus (85.7%)**. Tiga kegagalan di atas belum terbukti sudah diperbaiki.

Angka 85.7% tidak menggambarkan kondisi sebenarnya tanpa tiga kegagalan ini.

## Yang belum diuji

- Pengiriman pesan real-time (Socket.IO) belum terbukti berfungsi di tes.
- Tes E2E belum mencakup alur frontend (login dari browser).
- Tes belum dijalankan di CI (`.github/workflows/ci.yml` hanya menjalankan lint dan build client).

## Rencana berikutnya

1. Jalankan `e2e-load-test.js` ulang pada `experimental`, dan catat hasilnya di dokumen ini.
2. Tambahkan script `test` di `package.json`.
3. Perbaiki atau tandai tiga kegagalan Socket.IO.

## Catatan keselamatan

Jangan menghentikan proses dengan `Stop-Process` atau `taskkill /IM node.exe` untuk membersihkan tes. Itu juga mematikan proses node lain di komputer. Hentikan server dengan Ctrl+C di terminalnya.
