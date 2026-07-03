'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
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

export function NewsAgenda() {
  const [activeTab, setActiveTab] = useState<ArticleCategoryKey>('berita-utama')
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const group = articleCategories[activeTab]
  const articles = useMemo(() => [group.featured, ...group.latest], [group])
  const activeArticle = articles[activeIndex]
  const nextIndex = (activeIndex + 1) % articles.length

  function selectCategory(category: ArticleCategoryKey) {
    setActiveTab(category)
    setActiveIndex(0)
  }

  function handleTabKeydown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = articleTabs.length - 1
    let nextTabIndex: number | null = null

    if (event.key === 'ArrowRight') nextTabIndex = index === lastIndex ? 0 : index + 1
    else if (event.key === 'ArrowLeft') nextTabIndex = index === 0 ? lastIndex : index - 1
    else if (event.key === 'Home') nextTabIndex = 0
    else if (event.key === 'End') nextTabIndex = lastIndex

    if (nextTabIndex === null) return

    event.preventDefault()
    selectCategory(articleTabs[nextTabIndex].key)
    tabRefs.current[nextTabIndex]?.focus()
  }

  return (
    <section className="news-deck" id="kabar" aria-labelledby="news-deck-title">
      <div className="news-deck-shell">
        <header className="news-deck-head">
          <h2 id="news-deck-title">Kabar tidak menunggu untuk ditemukan.</h2>
          <div>
            <p>{newsAgendaIntro.lead}</p>
            <Link href="/berita">Semua berita</Link>
          </div>
        </header>

        <div className="news-deck-tabs" role="tablist" aria-label="Kategori berita">
          {articleTabs.map((tab, index) => {
            const isActive = tab.key === activeTab

            return (
              <button
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                type="button"
                className={isActive ? 'is-active' : undefined}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectCategory(tab.key)}
                onKeyDown={(event) => handleTabKeydown(event, index)}
                key={tab.key}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="news-deck-stage">
          <Image
            className="news-deck-ambient"
            src={assetSrc(activeArticle.image)}
            alt=""
            fill
            sizes="100vw"
            aria-hidden="true"
          />

          <article className="news-deck-feature" key={`${activeTab}-${articleSlug(activeArticle)}`}>
            <Link className="news-deck-media" href={`/berita/${articleSlug(activeArticle)}`}>
              <Image
                src={assetSrc(activeArticle.image)}
                alt={activeArticle.title}
                fill
                sizes="(max-width: 860px) 100vw, 65vw"
              />
              <span>{activeArticle.category}</span>
            </Link>

            <div className="news-deck-copy">
              <div className="news-deck-meta">
                <span>{String(activeIndex + 1).padStart(2, '0')} / {String(articles.length).padStart(2, '0')}</span>
                <time>{activeArticle.timeAgo}</time>
              </div>
              <h3>{activeArticle.title}</h3>
              <p>{activeArticle.excerpt}</p>
              <div className="news-deck-byline">
                <span>{activeArticle.publisherIcon}</span>
                <strong>{activeArticle.publisher}</strong>
                <small>{activeArticle.readTime}</small>
              </div>
              <Link className="news-deck-read" href={`/berita/${articleSlug(activeArticle)}`}>
                Baca cerita lengkap
              </Link>
            </div>
          </article>

          <aside className="news-deck-queue" aria-label="Pilih berita dalam kategori ini">
            <div className="news-deck-queue-head">
              <span>Pilih cerita</span>
              <span>{articleTabs.find((tab) => tab.key === activeTab)?.label}</span>
            </div>
            {articles.map((article, index) => (
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : undefined}
                onClick={() => setActiveIndex(index)}
                aria-pressed={index === activeIndex}
                key={`${articleSlug(article)}-${index}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{article.title}</strong>
                <small>{article.readTime}</small>
              </button>
            ))}
          </aside>
        </div>

        <button className="news-deck-next" type="button" onClick={() => setActiveIndex(nextIndex)}>
          <span>Lanjut ke cerita berikutnya</span>
          <strong>{articles[nextIndex].title}</strong>
          <small>{String(nextIndex + 1).padStart(2, '0')}</small>
        </button>
      </div>
    </section>
  )
}
