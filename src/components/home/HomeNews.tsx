'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArticleCover } from '@/components/site/ArticleCover'
import { usePageSection } from '@/components/site/PageContentProvider'
import { articleTabs } from '@/data/articles'
import type { PublicArticle } from '@/lib/article-data'
import type { ArticleCategoryKey } from '@/types/content'
import { ArrowIcon, ChevronIcon } from './HomeMotion'

/*
 * Kabar di beranda: judul seksi berupa kotak navy yang sekaligus memegang
 * pilihan kategori; di sebelahnya satu berita utama dan baris-baris cerita
 * lain. Beranda etalase, bukan arsip, jadi paling banyak lima cerita per
 * kategori.
 */
const MAX_STORIES_PER_CATEGORY = 5

export function HomeNews({ articles }: { articles: PublicArticle[] }) {
  const { fields } = usePageSection('news')
  const byCategory = useMemo(() => {
    const grouped = new Map<ArticleCategoryKey, PublicArticle[]>()
    articles.forEach((article) => {
      const bucket = grouped.get(article.categoryKey)
      if (bucket) bucket.push(article)
      else grouped.set(article.categoryKey, [article])
    })
    return grouped
  }, [articles])
  const tabs = useMemo(() => articleTabs.filter((tab) => byCategory.has(tab.key)), [byCategory])
  const [chosen, setChosen] = useState<ArticleCategoryKey | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Diturunkan, bukan disimpan: kategori pilihan bisa hilang saat halaman direvalidasi.
  const current = chosen && byCategory.has(chosen) ? chosen : tabs[0]?.key
  const stories = current ? (byCategory.get(current) ?? []).slice(0, MAX_STORIES_PER_CATEGORY) : []
  const [lead, ...rest] = stories

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
        : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
          : event.key === 'Home' ? 0
            : event.key === 'End' ? last
              : null
    if (next === null) return
    event.preventDefault()
    setChosen(tabs[next].key)
    tabRefs.current[next]?.focus()
  }

  if (!lead || !current) {
    return (
      <section className="av-sec av-news" id="kabar" aria-labelledby="news-deck-title">
        <div className="av-frame av-grid">
          <header className="av-box av-box--deep av-title av-news-title" data-reveal="">
            <h2 id="news-deck-title">{fields.emptyTitle}</h2>
            <div className="av-title-foot">
              <p className="av-lead">{fields.emptyLead}</p>
              <Link className="av-link av-link--dark" href="/agenda">
                {fields.emptyIndexAction}
                <ArrowIcon />
              </Link>
            </div>
          </header>
          <div className="av-box av-news-empty" data-reveal="" style={{ '--d': '90ms' } as React.CSSProperties}>
            <p>{fields.emptyBody}</p>
            <div className="av-actions">
              <Link className="av-btn av-btn--navy" href="/program-kerja">
                <strong>{fields.emptyPrimaryAction}</strong>
                <ArrowIcon />
              </Link>
              <Link className="av-btn av-btn--line" href="/agenda">
                <strong>{fields.emptySecondaryAction}</strong>
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="av-sec av-news" id="kabar" aria-labelledby="news-deck-title">
      <div className="av-frame av-grid">
        <header className="av-box av-box--deep av-title av-news-title" data-reveal="">
          <h2 id="news-deck-title">{fields.publishedTitle}</h2>
          <div className="av-title-foot">
            <p className="av-lead">{fields.publishedLead}</p>
            {tabs.length > 1 ? (
              <div className="av-pills" role="tablist" aria-label={fields.kicker}>
                {tabs.map((tab, index) => {
                  const active = tab.key === current
                  return (
                    <button
                      key={tab.key}
                      ref={(element) => {
                        tabRefs.current[index] = element
                      }}
                      type="button"
                      role="tab"
                      id={`av-tab-${tab.key}`}
                      aria-selected={active}
                      aria-controls="av-news-panel"
                      tabIndex={active ? 0 : -1}
                      className={active ? 'is-active' : undefined}
                      onClick={() => setChosen(tab.key)}
                      onKeyDown={(event) => onTabKey(event, index)}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            ) : null}
            <Link className="av-link av-link--dark" href="/berita">
              {fields.publishedAction}
              <ArrowIcon />
            </Link>
          </div>
        </header>

        <div
          className="av-news-body"
          key={current}
          id="av-news-panel"
          role={tabs.length > 1 ? 'tabpanel' : undefined}
          aria-labelledby={tabs.length > 1 ? `av-tab-${current}` : undefined}
          data-solo={rest.length ? undefined : ''}
        >
          <article className="av-box av-story">
            <Link className="av-story-media" href={`/berita/${lead.slug}`} tabIndex={-1} aria-hidden>
              <ArticleCover src={lead.image} alt="" slug={lead.slug} sizes="(max-width: 900px) 100vw, 460px" decorative />
            </Link>
            <div className="av-story-copy">
              <p className="av-meta">
                <span className="av-tag">{lead.categoryLabel}</span>
                <time dateTime={lead.dateIso || undefined}>{lead.publishedLabel}</time>
                <span>{lead.readTime}</span>
              </p>
              <h3>
                <Link href={`/berita/${lead.slug}`}>{lead.title}</Link>
              </h3>
              <p className="av-story-excerpt">{lead.excerpt}</p>
              <p className="av-story-foot">
                <span>{lead.publisher}</span>
                <Link href={`/berita/${lead.slug}`} className="av-link">
                  {fields.storyAction}
                  <ArrowIcon />
                </Link>
              </p>
            </div>
          </article>

          {rest.length ? (
            <nav className="av-box av-rows" aria-label={fields.relatedLabel}>
              <p className="av-rows-head">{fields.relatedLabel}</p>
              {rest.map((article) => (
                <Link className="av-row" href={`/berita/${article.slug}`} key={article.slug}>
                  <span className="av-row-text">
                    <strong>{article.title}</strong>
                    <small>{article.publishedLabel} · {article.readTime}</small>
                  </span>
                  <ChevronIcon />
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  )
}
