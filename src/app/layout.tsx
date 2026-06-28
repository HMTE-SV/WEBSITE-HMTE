import type { Metadata } from 'next'
import '../../css/hmte.css'

export const metadata: Metadata = {
  title: 'HMTE TRE SV UGM - Elektro... Satu!!!',
  description:
    'Website HMTE TRE SV UGM sebagai rumah informasi organisasi, kegiatan mahasiswa, program kerja, prestasi, galeri, alumni, dan kolaborasi.',
  icons: {
    icon: '/assets/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
