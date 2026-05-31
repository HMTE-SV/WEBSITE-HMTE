import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { getAllArticles } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Berita HMTE TRE SV UGM',
  description: 'Kumpulan berita, prestasi, alumni, magang, proyek akhir, pendidikan, penelitian, dan pengabdian HMTE.',
}

export default function NewsPage() {
  const articles = getAllArticles()

  return (
    <PublicPageFrame activeHref="/berita">
      <PublicPageHeader
        kicker="Publikasi"
        title="Berita HMTE"
        lead="Ruang publikasi untuk kabar akademik, prestasi mahasiswa, agenda alumni, peluang magang, proyek akhir, penelitian, dan pengabdian."
      />
      <PublicSection title="Berita terbaru">
        <div className="public-grid">
          {articles.map((article) => (
            <PublicCard
              eyebrow={article.categoryLabel}
              title={article.title}
              body={article.excerpt}
              href={`/berita/${article.slug}`}
              image={article.image}
              meta={`${article.publisher} · ${article.timeAgo} · ${article.readTime}`}
              key={article.slug}
            />
          ))}
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
