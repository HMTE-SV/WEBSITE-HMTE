import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
