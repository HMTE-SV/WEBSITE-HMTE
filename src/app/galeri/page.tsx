import type { Metadata } from 'next'
import Image from 'next/image'
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
            <p>Urutannya ditentukan pengurus lewat panel, bukan oleh tanggal unggah.</p>
          </div>

          {galleryItems.length > 0 ? (
            <div className="gallery-mosaic">
              {/*
                Tidak ada lagi <Link> membungkus tiap foto. Dulu setiap kartu
                menuju /berita/[slug] karena isinya memang sampul berita yang
                di-dedup, bukan dokumentasi. Item galeri berdiri sendiri dan
                tidak punya halaman tujuan, jadi memaksakan tautan cuma
                menghasilkan pranala mati.
              */}
              {galleryItems.map((item, index) => (
                <div
                  className={index === 0 ? 'gallery-mosaic-item is-lead' : 'gallery-mosaic-item'}
                  key={item.id}
                >
                  <figure>
                    <Image
                      src={item.imageUrl}
                      alt={item.alt}
                      fill
                      priority={index === 0}
                      sizes={index === 0 ? '(max-width: 760px) 100vw, 58vw' : '(max-width: 760px) 100vw, 34vw'}
                    />
                    <span className="gallery-mosaic-index">{String(index + 1).padStart(2, '0')}</span>
                    <figcaption>
                      <h3>{item.title}</h3>
                      {item.caption ? <p>{item.caption}</p> : null}
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
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
