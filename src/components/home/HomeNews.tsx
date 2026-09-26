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
import { LedBoard } from './LedBoard'

/*
 * Kabar di beranda: satu berita utama per kategori, sisanya baris yang
 * bisa diketuk penuh langsung ke beritanya. Beranda etalase, bukan arsip,
 * jadi paling banyak lima cerita per kategori.
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
      <section className="p10-news p10-module" id="kabar" aria-labelledby="news-deck-title">
        <header className="p10-head">
          <h2 id="news-deck-title">{fields.emptyTitle}</h2>
          <Link className="p10-head-action" href="/agenda">
            {fields.emptyIndexAction}
            <ArrowIcon />
          </Link>
          <p className="p10-lead">{fields.emptyLead}</p>
        </header>
        <div className="p10-news-empty">
          <p>{fields.emptyBody}</p>
          <div className="p10-actions">
            <Link className="p10-button p10-button--gold" href="/program-kerja">
              <strong>{fields.emptyPrimaryAction}</strong>
              <ArrowIcon />
            </Link>
            <Link className="p10-button p10-button--ghost" href="/agenda">
              <strong>{fields.emptySecondaryAction}</strong>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="p10-news p10-module" id="kabar" aria-labelledby="news-deck-title">
      <header className="p10-head">
        <h2 id="news-deck-title">{fields.publishedTitle}</h2>
        <Link className="p10-head-action" href="/berita">
          {fields.publishedAction}
          <ArrowIcon />
        </Link>
        <p className="p10-lead">{fields.publishedLead}</p>
      </header>

      {/* Satu sorot seksi ini: judul-judul kategori aktif berjalan di papan. */}
      <div className="p10-board p10-board--headlines">
        <LedBoard
          scenes={[{ kind: 'marquee', text: [...stories.map((story) => `${story.categoryLabel} · ${story.publishedLabel} — ${story.title}`), fields.kicker].join('   ◆   ').toUpperCase(), speed: 34 }]}
          loop
          pitch={3}
          widePitch={4}
          threshold={0.2}
        />
      </div>

      {tabs.length > 1 ? (
        <div className="p10-pills" role="tablist" aria-label={fields.kicker}>
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
                aria-selected={active}
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

      <div className="p10-news-body" key={current} data-solo={rest.length ? undefined : ''}>
        <article className="p10-story">
          <Link className="p10-story-media" href={`/berita/${lead.slug}`} tabIndex={-1} aria-hidden>
            <ArticleCover src={lead.image} alt="" slug={lead.slug} sizes="(max-width: 900px) 100vw, 680px" decorative />
          </Link>
          <div className="p10-story-copy">
            <p className="p10-meta">
              <span>{lead.categoryLabel}</span>
              <time dateTime={lead.dateIso || undefined}>{lead.publishedLabel}</time>
              <span>{lead.readTime}</span>
            </p>
            <h3>
              <Link href={`/berita/${lead.slug}`}>{lead.title}</Link>
            </h3>
            <p className="p10-story-excerpt">{lead.excerpt}</p>
            <p className="p10-story-foot">
              <span>{lead.publisher}</span>
              <Link href={`/berita/${lead.slug}`} className="p10-link">
                {fields.storyAction}
                <ArrowIcon />
              </Link>
            </p>
          </div>
        </article>

        {rest.length ? (
          <nav className="p10-rows" aria-label={fields.relatedLabel}>
            <p className="p10-rows-head">{fields.relatedLabel}</p>
            {rest.map((article) => (
              <Link className="p10-row" href={`/berita/${article.slug}`} key={article.slug}>
                <span className="p10-row-text">
                  <strong>{article.title}</strong>
                  <small>{article.publishedLabel} · {article.readTime}</small>
                </span>
                <ChevronIcon />
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </section>
  )
}
