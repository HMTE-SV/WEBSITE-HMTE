import type { Metadata, Viewport } from 'next'
import { Caveat, Geist, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { MediaSlotProvider } from '@/components/site/MediaSlotProvider'
import { MobileMenuProvider } from '@/components/site/MobileMenu'
import { ServiceWorkerRegistration } from '@/components/site/ServiceWorkerRegistration'
import { SiteSettingsProvider } from '@/components/site/SiteSettingsProvider'
import { getPublicMediaSlots } from '@/lib/media-slot-data'
import { getSiteSettings } from '@/lib/site-settings-data'
import '../../css/hmte.css'
import '../../css/admin-panel.css'
import '../../css/landing-redesign.css'
import '../../css/landing-v3.css'
import '../../css/landing-about-v5.css'
import '../../css/contact-postal.css'
import '../../css/org-pages.css'
import '../../css/hero-backdrop.css'
import '../../css/ui-soft.css'
import '../../css/downloads.css'
import '../../css/data-library.css'
/*
 * Diimpor PALING AKHIR, dan itu disengaja.
 *
 * css/program-stage.css tidak mewarisi apa pun dari ui-soft.css, tapi keduanya
 * hidup di halaman yang sama. Urutan terakhir memastikan papan tahun menang
 * kalau ada nama kelas yang kebetulan bertabrakan, tanpa perlu satu pun
 * !important untuk memaksanya.
 */
import '../../css/program-stage.css'
/*
 * Tambalan layar kecil dan layar sentuh. Sengaja setelah program-stage.css:
 * isinya menimpa ukuran yang sudah ada (target sentuh, huruf isian, safe-area),
 * bukan membuat gaya baru, jadi ia harus menang di urutan.
 */
import '../../css/mobile.css'
import '../../css/mobile-pages.css'
import '../../css/hero-opener.css'
import '../../css/mobile-nav.css'

/*
 * Font di-host sendiri lewat next/font, bukan @import Google Fonts di CSS.
 * @import itu berantai (HTML -> CSS -> CSS font -> berkas font) dan memblokir
 * render; di HP ia penyumbang terbesar LCP yang lambat. Keluarganya sama
 * persis, yang berubah hanya cara memuatnya. CSS membacanya lewat variabel
 * di bawah (lihat token --font-* di hmte.css).
 */
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' })
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })
// Hanya dipakai kartu pos di /kontak; tidak perlu di-preload di halaman lain.
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap', preload: false })
const fontVariables = [geist.variable, plusJakartaSans.variable, jetBrainsMono.variable, caveat.variable].join(' ')

export async function generateMetadata(): Promise<Metadata> {
  const [slots, settings] = await Promise.all([getPublicMediaSlots(), getSiteSettings()])
  const favicon = slots['brand.favicon']
  const openGraphImage = slots['seo.default-og']

  return {
    metadataBase: new URL(settings.siteUrl),
    title: settings.siteTitle,
    description: settings.siteDescription,
    applicationName: settings.siteName,
    icons: {
      icon: favicon.url,
      // iOS memakai ini untuk ikon layar utama, bukan ikon di manifest.
      apple: '/icons/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: settings.locale,
      url: settings.siteUrl,
      siteName: settings.siteName,
      title: settings.siteTitle,
      description: settings.siteDescription,
      ...(openGraphImage.url
        ? {
            images: [{
              url: openGraphImage.url,
              alt: openGraphImage.alt,
              ...(openGraphImage.width ? { width: openGraphImage.width } : {}),
              ...(openGraphImage.height ? { height: openGraphImage.height } : {}),
            }],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteTitle,
      description: settings.siteDescription,
      ...(openGraphImage.url ? { images: [openGraphImage.url] } : {}),
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Isi boleh mengisi area di balik notch/home indicator; jaraknya dijaga
  // lewat env(safe-area-inset-*) di css/mobile.css.
  viewportFit: 'cover',
  themeColor: '#011f4b',
  colorScheme: 'light',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [slots, settings] = await Promise.all([getPublicMediaSlots(), getSiteSettings()])

  return (
    <html lang="id" className={fontVariables}>
      <body>
        <SiteSettingsProvider settings={settings}>
          <MediaSlotProvider slots={slots}>
            <MobileMenuProvider>{children}</MobileMenuProvider>
            <ServiceWorkerRegistration />
          </MediaSlotProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  )
}
