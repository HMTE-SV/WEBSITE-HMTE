'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

function PublisherRow({ article }: { article: ArticleSummary }) {
  return (
    <div className="landing-news-publisher">
      <span>{article.publisherIcon}</span>
      <strong>{article.publisher}</strong>
      <time>{article.timeAgo}</time>
    </div>
  )
}

export function NewsAgenda() {
  const [activeTab, setActiveTab] = useState<ArticleCategoryKey>('berita-utama')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const dragState = useRef({ active: false, moved: false, startScroll: 0, startX: 0 })
  const group = articleCategories[activeTab]
  const articles = useMemo(() => [group.featured, ...group.latest], [group])

  function selectCategory(category: ArticleCategoryKey) {
    setActiveTab(category)
    setActiveIndex(0)
    window.requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0, behavior: 'smooth' }))
  }

  function handleTabKeydown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = articleTabs.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = lastIndex

    if (nextIndex === null) return

    event.preventDefault()
    selectCategory(articleTabs[nextIndex].key)
    tabRefs.current[nextIndex]?.focus()
  }

  function updateActiveCard() {
    const track = trackRef.current
    if (!track) return

    const cards = Array.from(track.children) as HTMLElement[]
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2
    const closestIndex = cards.reduce((bestIndex, card, index) => {
      const bounds = card.getBoundingClientRect()
      const distance = Math.abs(bounds.left + bounds.width / 2 - trackCenter)
      const bestBounds = cards[bestIndex].getBoundingClientRect()
      const bestDistance = Math.abs(bestBounds.left + bestBounds.width / 2 - trackCenter)
      return distance < bestDistance ? index : bestIndex
    }, 0)

    setActiveIndex(closestIndex)
  }

  function nudgeTrack(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return

    const cards = Array.from(track.children) as HTMLElement[]
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), cards.length - 1)
    const trackBounds = track.getBoundingClientRect()
    const cardBounds = cards[nextIndex].getBoundingClientRect()
    const targetLeft = track.scrollLeft + cardBounds.left - trackBounds.left

    track.scrollTo({ left: targetLeft, behavior: 'smooth' })
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track) return

    dragState.current = {
      active: true,
      moved: false,
      startScroll: track.scrollLeft,
      startX: event.clientX,
    }
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track || !dragState.current.active) return

    const distance = event.clientX - dragState.current.startX
    if (Math.abs(distance) > 7) dragState.current.moved = true
    track.scrollLeft = dragState.current.startScroll - distance * 1.08
  }

  function releasePointer(event: ReactPointerEvent<HTMLDivElement>) {
    dragState.current.active = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <section className="landing-news" id="kabar" aria-labelledby="landing-news-title">
      <div className="landing-news-shell">
        <header className="landing-news-head">
          <div>
            <span className="landing-eyebrow">News & Agenda</span>
            <h2 id="landing-news-title">Kabar yang terus bergerak.</h2>
          </div>
          <div className="landing-news-intro">
            <p>{newsAgendaIntro.lead}</p>
            <Link href="/berita">Buka ruang berita</Link>
          </div>
        </header>

        <div className="landing-news-categories" role="tablist" aria-label="Kategori berita">
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
                <span>{String(index + 1).padStart(2, '0')}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="landing-news-stage">
          <div className="landing-news-stage-meta" aria-live="polite">
            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
            <div><i style={{ width: `${((activeIndex + 1) / articles.length) * 100}%` }} /></div>
            <span>{String(articles.length).padStart(2, '0')}</span>
          </div>

          <div
            ref={trackRef}
            className={isDragging ? 'landing-news-track is-dragging' : 'landing-news-track'}
            role="tabpanel"
            aria-label={`Artikel ${articleTabs.find((tab) => tab.key === activeTab)?.label}`}
            onScroll={updateActiveCard}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={releasePointer}
            onPointerCancel={releasePointer}
            onClickCapture={(event) => {
              if (dragState.current.moved) {
                event.preventDefault()
                event.stopPropagation()
                dragState.current.moved = false
              }
            }}
          >
            {articles.map((article, index) => (
              <article
                className={index === 0 ? 'landing-news-card is-featured' : 'landing-news-card'}
                key={`${activeTab}-${articleSlug(article)}-${index}`}
              >
                <Link href={`/berita/${articleSlug(article)}`} draggable={false}>
                  <div className="landing-news-image">
                    <Image
                      src={assetSrc(article.image)}
                      alt={article.title}
                      fill
                      draggable={false}
                      sizes={index === 0 ? '(max-width: 760px) 88vw, 58vw' : '(max-width: 760px) 78vw, 30vw'}
                    />
                    <span>{article.category}</span>
                  </div>
                  <div className="landing-news-card-copy">
                    <PublisherRow article={article} />
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                    <div>
                      <span>{article.readTime}</span>
                      <strong>Baca cerita</strong>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="landing-news-controls">
            <p>Tarik kartu atau gunakan kontrol untuk menjelajah.</p>
            <div>
              <button type="button" onClick={() => nudgeTrack(-1)} disabled={activeIndex === 0}>
                Kembali
              </button>
              <button type="button" onClick={() => nudgeTrack(1)} disabled={activeIndex === articles.length - 1}>
                Teruskan
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
