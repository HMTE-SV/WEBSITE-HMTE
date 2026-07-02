import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { articleTabs } from '@/data/articles'
import { getAllArticles } from '@/lib/content'
import { NewsroomFeed } from './NewsroomFeed'

export const metadata: Metadata = {
  title: 'Berita HMTE TRE SV UGM',
  description: 'Kumpulan berita, prestasi, alumni, magang, proyek akhir, pendidikan, penelitian, dan pengabdian HMTE.',
}

export default function NewsPage() {
  const articles = getAllArticles()
  const [featuredArticle, ...feedArticles] = articles

  return (
    <PublicPageFrame activeHref="/berita">
      <section className="newsroom-hero" aria-labelledby="newsroom-title">
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
                <dd>{articleTabs.length.toString().padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Arsip</dt>
                <dd>2026</dd>
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
                <Image
                  src={featuredArticle.image.startsWith('/') ? featuredArticle.image : `/${featuredArticle.image}`}
                  alt={featuredArticle.title}
                  fill
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
          ) : null}
        </div>
      </section>

      <NewsroomFeed articles={feedArticles} tabs={articleTabs} />
    </PublicPageFrame>
  )
}
