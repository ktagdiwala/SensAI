import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx,js}'],
    exclude: ['test/**/*.spec.cjs'],
    globals: true,
  },
} as any)
