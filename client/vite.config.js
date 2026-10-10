import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Saat development (npm run dev), request API/socket diteruskan ke server Node
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/uploads": "http://localhost:3000",
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
});
