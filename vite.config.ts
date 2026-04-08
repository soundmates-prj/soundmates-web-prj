import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy AzuraCast audio stream and HLS to avoid CORS issues
      "/listen": {
        // AzuraCast nginx proxy — both ports tried to find Liquidsoap harbor
        // localhost:5000 = AzuraCast nginx, localhost:8000 = Liquidsoap harbor direct
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
        // Fallback rewrite: if target is unreachable, /listen stays as /listen
        rewrite: (path) => path,
      },
      "/hls": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
