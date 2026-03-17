import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy AzuraCast audio stream and HLS to avoid CORS issues
      "/listen": {
        target: "http://localhost:8081",
        changeOrigin: true,
        ws: true,
      },
      "/hls": {
        target: "http://localhost",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
