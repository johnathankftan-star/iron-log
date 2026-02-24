import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This is the critical line for mobile apps
  build: {
    outDir: 'dist',
  }
})
