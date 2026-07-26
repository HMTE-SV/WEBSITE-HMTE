import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    // Semua berkas tes berbagi satu instance emulator, jadi jangan dijalankan
    // paralel: dua berkas yang saling menghapus data akan bikin hasilnya
    // berubah-ubah tanpa sebab yang kelihatan.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
