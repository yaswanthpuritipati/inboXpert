import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/



export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/emails': 'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/send': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    }
  }
})
