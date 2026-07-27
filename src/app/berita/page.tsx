import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCover } from '@/components/site/ArticleCover'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { articleTabs } from '@/data/articles'
import { getPublishedArticleFeed, type PublicArticle } from '@/lib/article-data'
import { NewsroomFeed } from './NewsroomFeed'

/*
 * ISR, bukan force-dynamic.
 *
 * Dengan force-dynamic setiap kunjungan menembak Firestore, dan di paket Spark
 * kuota baca habis oleh pengunjung yang membaca daftar berita yang sama persis.
 * Lima menit adalah batas atas keterlambatan yang bisa terjadi seandainya
 * revalidasi terarah gagal; jalur normalnya, /api/revalidate dipanggil panel
 * begitu artikel terbit, jadi halaman ini sudah segar dalam hitungan detik.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Berita HMTE TRE SV UGM',
  description: 'Kumpulan berita, prestasi, alumni, magang, proyek akhir, pendidikan, penelitian, dan pengabdian HMTE.',
}

export default async function NewsPage() {
  let articles: PublicArticle[] = []
  let loadError = false

  try {
    articles = await getPublishedArticleFeed()
  } catch {
    loadError = true
  }

  const [featuredArticle, ...feedArticles] = articles
  const publishedChannels = new Set(articles.map((article) => article.categoryKey)).size

  return (
    <PublicPageFrame activeHref="/berita">
      <section
        className="newsroom-hero has-hero-backdrop"
        aria-labelledby="newsroom-title"
      >
        <HeroBackdrop variant="arc" />
        <div className="newsroom-shell newsroom-hero-grid">
          <div className="newsroom-hero-copy">
            <span className="newsroom-overline">Pusat kabar HMTE</span>
            <h1 id="newsroom-title">
              Berita yang <span>mengalir</span> dari elektro.
            </h1>
          </div>

          <div className="newsroom-hero-aside">
            <p>
              Kabar terbaru tentang karya, prestasi, peluang, dan pergerakan mahasiswa
              Teknologi Rekayasa Elektro UGM.
            </p>
            <dl className="newsroom-stats" aria-label="Ringkasan arsip berita">
              <div>
                <dt>Artikel</dt>
                <dd>{articles.length.toString().padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Kanal</dt>
                <dd>{publishedChannels.toString().padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Arsip</dt>
                <dd>{new Date().getFullYear()}</dd>
              </div>
            </dl>
          </div>

          <a className="newsroom-scroll-cue" href="#sorotan">
            <span>Gulir untuk membaca</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4v15m0 0 6-6m-6 6-6-6" />
            </svg>
          </a>
        </div>
      </section>

      <section className="newsroom-feature-section" id="sorotan" aria-labelledby="sorotan-title">
        <div className="newsroom-shell">
          <div className="newsroom-section-heading">
            <span>01</span>
            <h2 id="sorotan-title">Sorotan utama</h2>
            <p>Berita terbaru pilihan redaksi.</p>
          </div>

          {featuredArticle ? (
            <Link className="newsroom-feature" href={`/berita/${featuredArticle.slug}`}>
              <div className="newsroom-feature-media">
                <ArticleCover
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  slug={featuredArticle.slug}
                  priority
                  sizes="(max-width: 880px) 100vw, 66vw"
                />
              </div>
              <article className="newsroom-feature-copy">
                <div>
                  <span className="newsroom-category">{featuredArticle.categoryLabel}</span>
                  <span className="newsroom-feature-date">{featuredArticle.timeAgo}</span>
                </div>
                <h3>{featuredArticle.title}</h3>
                <p>{featuredArticle.excerpt}</p>
                <span className="newsroom-read-link">
                  Baca artikel
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </span>
              </article>
            </Link>
          ) : (
            <EmptyState
              title={loadError ? 'Berita belum dapat dimuat' : 'Belum ada berita resmi'}
              body={loadError
                ? 'Koneksi ke arsip Firestore sedang bermasalah. Silakan coba kembali beberapa saat lagi.'
                : 'Redaksi belum menerbitkan berita. Artikel yang masih berstatus draft tidak ditampilkan di halaman publik.'}
            />
          )}
        </div>
      </section>

      {articles.length > 0 ? <NewsroomFeed articles={feedArticles} tabs={articleTabs} /> : null}
    </PublicPageFrame>
  )
}
