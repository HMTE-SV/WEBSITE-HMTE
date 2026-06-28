'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { articleCategories, articleTabs } from '@/data/articles'
import { newsAgendaIntro } from '@/data/site-content'
import { slugify } from '@/lib/slug'
import type { ArticleCategoryKey, ArticleSummary } from '@/types/content'

function assetSrc(image: string) {
  return image.startsWith('/') ? image : `/${image}`
}

function articleSlug(article: ArticleSummary) {
  return slugify(article.slug || article.title)
}

function categoryClass(category: string) {
  return `cat-${category.toLowerCase().replace(/\s+/g, '-')}`
}

function PublisherRow({ article }: { article: ArticleSummary }) {
  return (
    <div className="card-publisher-row">
      <span className={`pub-badge pub-${article.publisherIcon.toLowerCase()}`}>{article.publisherIcon}</span>
      <span className="pub-name">{article.publisher}</span>
      <span className="pub-dot">•</span>
      <span className="pub-time">{article.timeAgo}</span>
    </div>
  )
}

export function NewsAgenda() {
  const [activeTab, setActiveTab] = useState<ArticleCategoryKey>('berita-utama')
  const group = articleCategories[activeTab]
  const featured = group.featured
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Roving-tabindex keyboard pattern for the WAI-ARIA tablist.
  function handleTabKeydown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = articleTabs.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = lastIndex

    if (nextIndex === null) return

    event.preventDefault()
    setActiveTab(articleTabs[nextIndex].key)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <section className="tre-news-agenda" id="stats">
      <div className="news-agenda-shell">
        <header className="news-agenda-head">
          <h2 className="news-agenda-title fade-up">
            {newsAgendaIntro.title}
            <span className="acc">.</span>
          </h2>
          <p className="news-agenda-lead fade-up">{newsAgendaIntro.lead}</p>
        </header>

        <div className="news-tabs-container fade-up">
          <div className="news-tabs-nav" role="tablist" aria-label="Kategori Berita">
            {articleTabs.map((tab, index) => {
              const isActive = tab.key === activeTab

              return (
                <button
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  type="button"
                  className={isActive ? 'news-tab-btn active' : 'news-tab-btn'}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  id={`news-tab-${tab.key}`}
                  aria-controls="news-tabpanel"
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  onKeyDown={(event) => handleTabKeydown(event, index)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div
          className="news-featured-container fade-up"
          id="news-tabpanel"
          role="tabpanel"
          aria-labelledby={`news-tab-${activeTab}`}
        >
          <article className="featured-article">
            <div className="feat-image-wrapper">
              <Image src={assetSrc(featured.image)} alt={featured.title} fill sizes="(max-width: 980px) 100vw, 55vw" />
            </div>
            <div className="feat-content">
              <div className="feat-publisher-row">
                <span className={`pub-badge pub-${featured.publisherIcon.toLowerCase()}`}>{featured.publisherIcon}</span>
                <span className="pub-name">{featured.publisher}</span>
                <span className="pub-dot">•</span>
                <span className="pub-time">{featured.timeAgo}</span>
              </div>
              <h3 className="feat-title">
                <Link href={`/berita/${articleSlug(featured)}`}>{featured.title}</Link>
              </h3>
              <p className="feat-excerpt">{featured.excerpt}</p>
              <div className="feat-footer-row">
                <span className={`feat-category ${categoryClass(featured.category)}`}>{featured.category}</span>
                <span className="feat-dot">•</span>
                <span className="feat-readtime">{featured.readTime}</span>
              </div>
            </div>
          </article>
        </div>

        <div className="news-latest-section fade-up">
          <div className="news-latest-header">
            <h3 className="news-latest-title">Berita Terkini</h3>
            <Link href="/berita" className="news-see-all">
              Lihat Semua{' '}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="news-card-grid">
            {group.latest.map((item, index) => (
              <article className="news-card" key={`${activeTab}-${articleSlug(item)}-${index}`}>
                <div className="card-image-wrapper">
                  <Image src={assetSrc(item.image)} alt={item.title} fill sizes="(max-width: 700px) 50vw, 22vw" />
                </div>
                <div className="card-body">
                  <PublisherRow article={item} />
                  <h4 className="card-title">
                    <Link href={`/berita/${articleSlug(item)}`}>{item.title}</Link>
                  </h4>
                  <p className="card-excerpt">{item.excerpt}</p>
                  <div className="card-footer-row">
                    <span className={`card-category ${categoryClass(item.category)}`}>{item.category}</span>
                    <span className="card-dot">•</span>
                    <span className="card-readtime">{item.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
