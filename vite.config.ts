import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy AzuraCast audio stream and HLS to avoid CORS issues
<<<<<<< Updated upstream
      '/listen': {
        target: 'http://localhost',
        changeOrigin: true,
        ws: true,
      },
      '/hls': {
        target: 'http://localhost',
=======
      "/listen": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,
      },
      "/hls": {
        target: "http://localhost:5000",
>>>>>>> Stashed changes
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
