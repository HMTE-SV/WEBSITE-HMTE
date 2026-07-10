import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { getAllArticles } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Galeri HMTE TRE SV UGM',
  description: 'Galeri dokumentasi kegiatan HMTE TRE SV UGM.',
}

export default function GalleryPage() {
  const galleryItems = Array.from(
    new Map(getAllArticles().map((article) => [article.image, article])).values(),
  )

  return (
    <PublicPageFrame activeHref="/galeri">
      <section className="gallery-index-hero" aria-labelledby="gallery-title">
        <div className="public-shell gallery-index-hero-grid">
          <div>
            <span className="gallery-index-kicker">Arsip visual HMTE</span>
            <h1 id="gallery-title">Kegiatan yang tertinggal dalam gambar.</h1>
          </div>
          <div className="gallery-index-intro">
            <p>
              Dokumentasi dari publikasi HMTE, DTEDI, Sekolah Vokasi, dan UGM—dirangkai
              sebagai pintu masuk menuju cerita lengkapnya.
            </p>
            <span>{String(galleryItems.length).padStart(2, '0')} sorotan terpilih</span>
          </div>
        </div>
      </section>

      <section className="gallery-archive" aria-labelledby="gallery-archive-title">
        <div className="public-shell">
          <div className="gallery-archive-heading">
            <span>Dokumentasi 2026</span>
            <h2 id="gallery-archive-title">Sorotan galeri</h2>
            <p>Pilih dokumentasi untuk membaca konteks kegiatan selengkapnya.</p>
          </div>

          {galleryItems.length > 0 ? (
            <div className="gallery-mosaic">
              {galleryItems.map((item, index) => (
                <Link
                  className={index === 0 ? 'gallery-mosaic-item is-lead' : 'gallery-mosaic-item'}
                  href={`/berita/${item.slug}`}
                  key={item.image}
                >
                  <figure>
                    <Image
                      src={item.image.startsWith('/') ? item.image : `/${item.image}`}
                      alt={item.title}
                      fill
                      priority={index === 0}
                      sizes={index === 0 ? '(max-width: 760px) 100vw, 58vw' : '(max-width: 760px) 100vw, 34vw'}
                    />
                    <span className="gallery-mosaic-index">{String(index + 1).padStart(2, '0')}</span>
                    <figcaption>
                      <span>{item.categoryLabel}</span>
                      <h3>{item.title}</h3>
                      <div>
                        <time>{item.timeAgo}</time>
                        <strong>Lihat cerita <b aria-hidden="true">↗</b></strong>
                      </div>
                    </figcaption>
                  </figure>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Galeri belum tersedia" body="Dokumentasi akan tampil setelah publikasi diterbitkan." />
          )}
        </div>
      </section>
    </PublicPageFrame>
  )
}
