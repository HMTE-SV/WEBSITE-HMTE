import type { Metadata, Viewport } from 'next'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { MediaSlotProvider } from '@/components/site/MediaSlotProvider'
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
 * Sistem desain panel admin (docs/DESIGN_ADMIN.md). Dilingkupi `.adm`, jadi ia
 * hidup berdampingan dengan admin-panel.css lama selama halaman dipindahkan
 * satu per satu. Berkas lama dibuang begitu tidak ada lagi yang memakainya.
 */
import '../../css/admin.css'
import '../../css/admin-dashboard.css'
import '../../css/admin-publikasi.css'
import '../../css/admin-organisasi.css'
/*
 * Diimpor PALING AKHIR, dan itu disengaja.
 *
 * css/program-stage.css tidak mewarisi apa pun dari ui-soft.css, tapi keduanya
 * hidup di halaman yang sama. Urutan terakhir memastikan papan tahun menang
 * kalau ada nama kelas yang kebetulan bertabrakan, tanpa perlu satu pun
 * !important untuk memaksanya.
 */
import '../../css/program-stage.css'

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
    <html lang="id">
      <body>
        <SiteSettingsProvider settings={settings}>
          <MediaSlotProvider slots={slots}>{children}</MediaSlotProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  )
}
