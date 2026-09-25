import type { Metadata } from 'next'
import { GalleryMosaic } from '@/components/site/GalleryMosaic'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { getPublishedGalleryItems, type PublicGalleryItem } from '@/lib/gallery-data'

/*
 * Jaring pengaman, bukan jalur utama. Lihat komentar `revalidate` di
 * src/app/page.tsx.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Galeri HMTE TRE SV UGM',
  description: 'Galeri dokumentasi kegiatan HMTE TRE SV UGM.',
}

export default async function GalleryPage() {
  let galleryItems: PublicGalleryItem[] = []
  let loadError = false

  try {
    galleryItems = await getPublishedGalleryItems()
  } catch {
    loadError = true
  }

  return (
    <PublicPageFrame activeHref="/galeri">
      <section
        className="gallery-index-hero has-hero-backdrop"
        aria-labelledby="gallery-title"
      >
        <HeroBackdrop variant="crest" />
        <div className="public-shell gallery-index-hero-grid">
          <div>
            <span className="gallery-index-kicker">Arsip visual HMTE</span>
            <h1 id="gallery-title">Kegiatan yang tertinggal dalam gambar.</h1>
          </div>
          <div className="gallery-index-intro">
            <p>
              Galeri hanya memuat dokumentasi kegiatan HMTE yang telah diperiksa konteks,
              kepemilikan, dan izin publikasinya.
            </p>
            <span>{String(galleryItems.length).padStart(2, '0')} sorotan terpilih</span>
          </div>
        </div>
      </section>

      <section className="gallery-archive" aria-labelledby="gallery-archive-title">
        <div className="public-shell">
          <div className="gallery-archive-heading">
            <span>Dokumentasi 2026/2027</span>
            <h2 id="gallery-archive-title">Sorotan galeri</h2>
          </div>

          {galleryItems.length > 0 ? (
            <GalleryMosaic items={galleryItems} />
          ) : (
            <EmptyState
              title={loadError ? 'Galeri belum dapat dimuat' : 'Galeri belum tersedia'}
              body={loadError
                ? 'Koneksi ke arsip Firestore sedang bermasalah. Silakan coba kembali beberapa saat lagi.'
                : 'Pengurus belum menerbitkan dokumentasi. Foto akan tampil setelah aset resmi dikumpulkan dan izin publikasinya diperiksa.'}
            />
          )}
        </div>
      </section>
    </PublicPageFrame>
  )
}
