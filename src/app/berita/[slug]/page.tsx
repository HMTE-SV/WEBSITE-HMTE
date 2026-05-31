import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { getAllArticles, getArticleBySlug } from '@/lib/content'

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string
  }>
}

export function generateStaticParams() {
  return getAllArticles().map((article) => ({
    slug: article.slug,
  }))
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {
      title: 'Berita tidak ditemukan',
    }
  }

  return {
    title: `${article.title} | HMTE TRE SV UGM`,
    description: article.excerpt,
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <PublicPageFrame activeHref="/berita">
      <PublicPageHeader
        kicker={article.categoryLabel}
        title={article.title}
        lead={`${article.publisher} · ${article.timeAgo} · ${article.readTime}`}
      />
      <PublicSection>
        <article className="article-detail">
          <Image src={`/${article.image}`} alt={article.title} width={1400} height={788} priority />
          <p>{article.excerpt}</p>
          <p>
            Konten lengkap berita ini akan dihubungkan ke database saat fase Firebase dan admin CMS
            berjalan. Untuk saat ini, halaman detail memakai data lokal yang sudah bertipe.
          </p>
          <Link className="btn btn-secondary" href="/berita">
            Kembali ke berita
          </Link>
        </article>
      </PublicSection>
    </PublicPageFrame>
  )
}
