import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your Spring Boot port
        changeOrigin: true,
      },
      '/stream': {
        target: 'ws://localhost:8080', // For your live websocket
        ws: true,
      }
    }
  }
})