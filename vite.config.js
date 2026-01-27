import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Isso aqui ensina ao Vite que @ = pasta src
      "@": path.resolve(__dirname, "./src"),
    },
  },
})