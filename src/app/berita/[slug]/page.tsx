import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleCover } from '@/components/site/ArticleCover'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getPublishedArticleBySlug, getPublishedArticleFeed } from '@/lib/article-data'
import { getProgramHref } from '@/lib/organization-slugs'

/* Alasan sama dengan /berita. Lihat komentar di src/app/berita/page.tsx. */
export const revalidate = 300

/*
 * Tanpa ini rute dinamis tetap dirender per permintaan dan `revalidate` di atas
 * tidak berlaku sama sekali. Artikel yang terbit setelah build tetap terlayani
 * karena dynamicParams dibiarkan menyala secara bawaan: slug yang belum ada di
 * daftar dirender sekali lalu ikut disimpan.
 */
export async function generateStaticParams() {
  const articles = await getPublishedArticleFeed().catch(() => [])
  return articles.map((article) => ({ slug: article.slug }))
}

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const article = await getPublishedArticleBySlug(slug)

    if (!article) return { title: 'Berita tidak ditemukan' }

    return {
      title: `${article.title} | HMTE TRE SV UGM`,
      description: article.excerpt,
      authors: [{ name: article.publisher }],
      openGraph: {
        title: article.title,
        description: article.excerpt,
        // Dihilangkan kalau berita ini tidak punya sampul. Sampul buatan kita
        // adalah SVG yang dirender di halaman, dan tidak ada pengambil
        // pratinjau tautan yang bisa merendernya. Membiarkan kosong membuat
        // pratinjau jatuh ke gambar bawaan situs, yang jujur.
        ...(article.image ? { images: [article.image] } : {}),
        type: 'article',
        ...(article.dateIso ? { publishedTime: article.dateIso } : {}),
      },
    }
  } catch {
    return { title: 'Berita HMTE TRE SV UGM' }
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)

  if (!article) notFound()

  const relatedArticles = (await getPublishedArticleFeed())
    .filter((item) => item.slug !== article.slug && item.categoryKey === article.categoryKey)
    .slice(0, 3)
  const showArticleMeta = article.showArticleMeta !== false

  return (
    <PublicPageFrame activeHref="/berita">
      <article className="article-story">
        <header className="article-story-hero">
          <div className="public-shell">
            <Link className="article-story-back" href="/berita">
              <span aria-hidden="true">←</span> Kembali ke berita
            </Link>
            <div className="article-story-heading">
              <span>{article.categoryLabel}</span>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
            </div>
          </div>
        </header>

        <div className="public-shell article-story-media">
          <figure>
            <ArticleCover
              src={article.image}
              alt={article.title}
              slug={article.slug}
              priority
              sizes="(max-width: 760px) 100vw, 1200px"
            />
            <figcaption>{article.categoryLabel} · Dokumentasi {article.publisher}</figcaption>
          </figure>
        </div>

        <section className="article-story-body" aria-label="Isi berita">
          <div className={`public-shell article-story-body-grid${showArticleMeta ? '' : ' article-story-body-grid--without-meta'}`}>
            {showArticleMeta ? (
              <aside className="article-story-facts" aria-label="Informasi publikasi">
                <div className="article-story-facts-heading">
                  <span><i aria-hidden="true" /> Informasi artikel</span>
                  <small>Detail publikasi resmi</small>
                </div>
                <dl>
                  <div><dt>Penerbit</dt><dd>{article.publisher}</dd></div>
                  <div><dt>Terbit</dt><dd>{article.publishedLabel}</dd></div>
                  <div><dt>Kategori</dt><dd>{article.categoryLabel}</dd></div>
                  <div><dt>Program terkait</dt><dd>{article.relatedProgram ? <Link href={getProgramHref({ name: article.relatedProgram })}>{article.relatedProgram}<span aria-hidden="true">↗</span></Link> : 'Tidak terkait program tertentu'}</dd></div>
                </dl>
              </aside>
            ) : null}
            <div className="article-story-copy">
              <div className="article-rich-content" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
              <div className="article-story-note">
                <span>Catatan redaksi</span>
                <p>Informasi pada halaman ini diterbitkan melalui panel redaksi HMTE TRE SV UGM.</p>
              </div>
            </div>
          </div>
        </section>

        {relatedArticles.length > 0 ? (
          <section className="article-related" aria-labelledby="article-related-title">
            <div className="public-shell">
              <div className="article-related-heading">
                <div><span>Masih dalam kanal</span><h2 id="article-related-title">Baca berikutnya</h2></div>
                <Link href="/berita">Lihat semua berita</Link>
              </div>
              <div className="article-related-grid">
                {relatedArticles.map((item, index) => (
                  <Link href={`/berita/${item.slug}`} key={item.slug}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><time>{item.publishedLabel}</time><h3>{item.title}</h3><strong>Baca artikel <b aria-hidden="true">→</b></strong></div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </article>
    </PublicPageFrame>
  )
}
