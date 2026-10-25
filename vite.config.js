import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE || (command === 'build' ? './' : '/'),
  build: { chunkSizeWarningLimit: 1500 },
}))