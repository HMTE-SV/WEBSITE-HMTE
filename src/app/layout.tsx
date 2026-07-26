import type { Metadata, Viewport } from 'next'
import '../../css/hmte.css'
import '../../css/admin-panel.css'
import '../../css/landing-redesign.css'
import '../../css/landing-v3.css'
import '../../css/landing-about-v5.css'
import '../../css/contact-postal.css'
import '../../css/org-pages.css'
import '../../css/hero-backdrop.css'
import '../../css/agenda-year.css'

const siteUrl = 'https://website-hmte.vercel.app'
const siteName = 'HMTE TRE SV UGM'
const siteTitle = 'HMTE TRE SV UGM - Elektro... Satu!!!'
const siteDescription =
  'Website HMTE TRE SV UGM sebagai rumah informasi organisasi, kegiatan mahasiswa, program kerja, prestasi, galeri, alumni, dan kolaborasi.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: '/assets/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
}

export const viewport: Viewport = {
  themeColor: '#011f4b',
  colorScheme: 'light',
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
