# Brancher — Networking & Akses Jaringan

Cara mengakses Brancher dari perangkat lain: satu WiFi, Tailscale, atau (opsional) internet.

> Dokumen ini menggantikan `NETWORK.md`, `TAILSCALE.md`, dan `QUICK-START-NETWORK.md` (kini di `docs/archive/`).

---

## 1. Mode akses

| Dari mana | URL | Catatan |
|-----------|-----|---------|
| Mesin sendiri | `http://localhost:5173` (dev) / `http://localhost:3000` (produksi) | Paling cepat |
| Satu WiFi (LAN) | `http://<IP-LAN>:5173` | Ganti `<IP-LAN>` dengan hasil `ipconfig` |
| Tailscale | `http://100.100.1.1:5173` | Dari perangkat mana pun yang tergabung di tailnet |
| Hostname Tailscale | `http://kenz-win10:5173` | Butuh Tailscale DNS aktif |
| Internet | Lihat `docs/DEPLOYMENT.md` | Untuk produksi; wajib HTTPS |

**Cara cek IP LAN** (berubah-ubah karena DHCP, jangan di-hardcode):

```powershell
ipconfig
# Lihat "IPv4 Address" pada adapter WiFi/Ethernet yang aktif
```

IP LAN Brancher sebelumnya pernah tercatat `192.168.10.197` dan `192.168.0.108` — keduanya **usang**. Selalu cek ulang.

## 2. Konfigurasi yang dibutuhkan

Agar bisa diakses dari perangkat lain, dua service harus listen di semua interface:

```javascript
// server/index.js
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, ...);
```

```env
# .env
HOST=0.0.0.0
```

Frontend dev server (`client/vite.config.js`) juga harus listen `0.0.0.0`, dan `allowedHosts` **tidak boleh** memuat IP hardcode. Kalau muncul error *"This host is not allowed"*, itu penyebabnya — perbaiki di `vite.config.js`, bukan di dokumen ini.

> Catatan status: `client/vite.config.js` saat ini masih memuat IP lama (`192.168.10.197`) di `allowedHosts`. Ini perlu diganti (sebaiknya env-driven) sebelum akses LAN via IP baru bisa jalan. Belum diperbaiki — dicatat di sini supaya tidak terlupa.

## 3. Tailscale

Tailscale membuat jaringan privat antar perangkat, bisa diakses dari jaringan mana pun tanpa membuka port ke internet.

```powershell
tailscale status          # cek perangkat & status
tailscale ip -4           # lihat IP Tailscale mesin ini
tailscale up              # nyalakan
tailscale down && tailscale up   # restart koneksi kalau bermasalah
```

Syarat dari perangkat lain: Tailscale terinstall, login akun yang sama, status `active`.

## 4. Reverse proxy (nginx) — contoh dev

Contoh di bawah meneruskan ke dev server (5173). Untuk produksi lihat `docs/DEPLOYMENT.md`.

```nginx
server {
    listen 80;
    server_name brancher.local;

    # Frontend dev server
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io (WebSocket)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

## 5. Expose ke internet (opsional, tidak disarankan untuk dev)

- **Cloudflare Tunnel**: `cloudflared tunnel create brancher` → route DNS → `cloudflared tunnel run`.
- **ngrok**: `ngrok http 5173` (frontend), `ngrok http 3000` (backend).

Untuk produksi, pakai pola di `docs/DEPLOYMENT.md` (HTTPS wajib, `NODE_ENV=production`). Jangan expose aplikasi dev ke internet.

## 6. Debugging

```powershell
netstat -ano | findstr :3000      # cek backend listening
netstat -ano | findstr :5173      # cek frontend listening
Test-NetConnection -ComputerName 100.100.1.1 -Port 5173   # tes konektivitas Tailscale
Get-NetFirewallRule -DisplayName *node* | Format-Table DisplayName, Direction, Action
```

| Masalah | Penyebab umum |
|---------|----------------|
| "Connection refused" | Service tidak jalan / firewall blokir |
| "This host is not allowed" | `allowedHosts` di `vite.config.js` |
| Frontend jalan, API tidak | Proxy `/api` atau `/socket.io` salah target |
| Tidak bisa dari HP | Beda WiFi, atau IP LAN berubah — cek `ipconfig` |
| Tailscale tidak jalan | `tailscale down && tailscale up` |

## 7. Keamanan

- Tailscale: akses terbatas ke perangkat di tailnet. Lebih aman daripada port terbuka.
- LAN: siapa pun di WiFi yang sama bisa mencoba akses. Jangan andalkan untuk produksi.
- Internet: **wajib** HTTPS + `NODE_ENV=production`. Lihat `docs/DEPLOYMENT.md`.
- Jangan pernah expose port dev (5173) ke internet publik.
