import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Tes rules dijalankan terpisah lewat `npm run test:rules` karena butuh
    // emulator Firestore yang hidup. Kalau ikut di sini, seluruh suite unit
    // akan gagal di mesin yang emulatornya belum menyala.
    exclude: ['node_modules/**', 'tests/rules/**'],
  },
})
