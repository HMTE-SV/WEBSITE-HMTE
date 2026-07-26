'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ArticleListItem } from '@/lib/content'
import type { ArticleTab } from '@/types/content'

type NewsroomFeedProps = {
  articles: ArticleListItem[]
  tabs: ArticleTab[]
}

const PAGE_SIZE = 12

export function NewsroomFeed({ articles, tabs }: NewsroomFeedProps) {
  const [activeCategory, setActiveCategory] = useState<string>('semua')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const gridRef = useRef<HTMLDivElement>(null)

  const filteredArticles = useMemo(
    () => activeCategory === 'semua'
      ? articles
      : articles.filter((article) => article.categoryKey === activeCategory),
    [activeCategory, articles],
  )
  const visibleArticles = filteredArticles.slice(0, visibleCount)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    grid.classList.add('is-observed')
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-newsroom-card]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((card) => card.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [activeCategory, visibleCount])

  return (
    <section className="newsroom-feed" aria-labelledby="semua-berita-title">
      <div className="newsroom-shell">
        <div className="newsroom-feed-top">
          <div className="newsroom-section-heading newsroom-section-heading--feed">
            <span>02</span>
            <h2 id="semua-berita-title">Semua berita</h2>
            <p>{filteredArticles.length} kabar dalam arsip.</p>
          </div>

          <div className="newsroom-filter" aria-label="Filter kategori berita">
            <button
              className={activeCategory === 'semua' ? 'is-active' : undefined}
              type="button"
              onClick={() => {
                setActiveCategory('semua')
                setVisibleCount(PAGE_SIZE)
              }}
            >
              Semua
            </button>
            {tabs.map((tab) => (
              <button
                className={activeCategory === tab.key ? 'is-active' : undefined}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.key)
                  setVisibleCount(PAGE_SIZE)
                }}
                key={tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="newsroom-grid" ref={gridRef} aria-live="polite">
          {visibleArticles.map((article, index) => (
            <Link
              className="newsroom-card"
              href={`/berita/${article.slug}`}
              data-newsroom-card
              style={{ '--reveal-delay': `${Math.min(index % 3, 2) * 80}ms` } as CSSProperties}
              key={article.slug}
            >
              <article>
                <div className="newsroom-card-media">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw"
                  />
                  <span className="newsroom-card-index">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="newsroom-card-copy">
                  <div className="newsroom-card-meta">
                    <span>{article.categoryLabel}</span>
                    <time>{article.timeAgo}</time>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className="newsroom-card-footer">
                    <span>{article.publisher}</span>
                    <span>{article.readTime}</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M5 12h14m-5-5 5 5-5 5" />
                    </svg>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {visibleCount < filteredArticles.length ? (
          <button
            className="newsroom-load-more"
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            <span>Tampilkan lebih banyak</span>
            <span>{Math.min(PAGE_SIZE, filteredArticles.length - visibleCount)} artikel</span>
          </button>
        ) : null}
      </div>
    </section>
  )
}
