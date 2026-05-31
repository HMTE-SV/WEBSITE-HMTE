import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
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
      <PublicPageHeader
        kicker="Galeri"
        title="Dokumentasi kegiatan"
        lead="Arsip visual sementara dari publikasi HMTE, DTEDI, SV UGM, dan UGM. Fase berikutnya akan menghubungkan galeri ke media upload."
      />
      <PublicSection title="Sorotan galeri">
        <div className="public-grid">
          {galleryItems.map((item) => (
            <PublicCard
              eyebrow={item.categoryLabel}
              title={item.title}
              body={item.excerpt}
              image={item.image}
              href={`/berita/${item.slug}`}
              key={item.image}
            />
          ))}
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
