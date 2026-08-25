import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Memungkinkan build verifikasi berjalan berdampingan dengan `next dev`
  // tanpa berebut lock `.next`. Vercel tetap memakai `.next` secara default.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        // Dibatasi ke ID akun kita, bukan seluruh ik.imagekit.io — supaya
        // next/image tidak bisa dipakai jadi proksi gambar akun orang lain.
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/jk001122/**',
      },
    ],
  },
  /*
   * Berkas arsip privat tinggal di private/arsip/, di luar public/, supaya
   * tidak pernah dilayani sebagai aset statis. Konsekuensinya Next tidak bisa
   * menebaknya sendiri: penelusuran berkas hanya mengikuti apa yang diimpor
   * kode, sedangkan rute berkas membacanya dari jalur yang baru diketahui saat
   * berjalan. Tanpa baris ini, arsip privat hilang begitu di-deploy.
   */
  outputFileTracingIncludes: {
    '/api/arsip/berkas/[projectId]/[documentId]': ['./private/arsip/**/*'],
  },
  reactStrictMode: true,
}

export default nextConfig
