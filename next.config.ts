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
  reactStrictMode: true,
}

export default nextConfig
