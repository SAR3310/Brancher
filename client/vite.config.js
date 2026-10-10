import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Saat development (npm run dev), request API/socket diteruskan ke server Node
// Server listen di 0.0.0.0 untuk accessible dari network & Tailscale
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "kenz-win10",
      "kenz-win10.tailscale-ip.net",
      "100.100.1.1",
      "192.168.10.197",
      ".tailscale-ip.net",
    ],
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000",
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
});
