import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // <-- change from '0.0.0.0' to true for LAN access in Vite 4+
    strictPort: true // optional: fail if port is taken
  }
})
