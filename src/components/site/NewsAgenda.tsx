'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { ArticleCover } from '@/components/site/ArticleCover'
import { usePageSection } from '@/components/site/PageContentProvider'
import { articleTabs } from '@/data/articles'
import type { PublicArticle } from '@/lib/article-data'
import type { ArticleCategoryKey } from '@/types/content'

/*
 * Seksi kabar di beranda.
 *
 * Datanya turun sebagai props dari src/app/page.tsx, sumber yang sama dengan
 * /berita. Yang tetap statis hanya `articleTabs`, karena daftar kategori memang
 * konfigurasi, bukan konten.
 *
 * Bentuknya dirombak dari "panggung" navy selebar 1440px menjadi kanvas
 * editorial. Alasannya bukan selera: panggung lama memberi satu foto bidang
 * selebar ~800px dengan tinggi paten 680px, jadi setiap foto dokumentasi 3:2
 * kehilangan sepertiga tinggi aslinya, dan judul seksi setinggi 96px mendorong
 * berita utama ke bawah lipatan. Sekarang kanvasnya dibatasi, fotonya memakai
 * rasio tetap, dan berita pendukung turun pangkat jadi daftar.
 *
 * Satu berita utama, sisanya daftar. Bukan dua panel yang sama besar.
 */

/*
 * Beranda adalah etalase, bukan arsip. Lebih dari lima cerita per kategori di
 * sini hanya memindahkan pekerjaan /berita ke tempat yang salah, dan daftarnya
 * jadi lebih tinggi daripada berita utama yang seharusnya jadi fokus.
 */
const MAX_STORIES_PER_CATEGORY = 5

type NewsAgendaProps = {
  articles: PublicArticle[]
}

export function NewsAgenda({ articles }: NewsAgendaProps) {
  const { fields } = usePageSection('news')
  const articlesByCategory = useMemo(() => {
    const grouped = new Map<ArticleCategoryKey, PublicArticle[]>()

    articles.forEach((article) => {
      const bucket = grouped.get(article.categoryKey)
      if (bucket) bucket.push(article)
      else grouped.set(article.categoryKey, [article])
    })

    return grouped
  }, [articles])

  /*
   * Kategori kosong tidak diberi tab. Tab yang diklik lalu tidak memberi apa-apa
   * lebih buruk daripada tab yang tidak ada.
   */
  const availableTabs = useMemo(
    () => articleTabs.filter((tab) => articlesByCategory.has(tab.key)),
    [articlesByCategory],
  )

  const [activeTab, setActiveTab] = useState<ArticleCategoryKey | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  /*
   * Tab aktif diturunkan, bukan disimpan sebagai kebenaran. Kategori yang
   * dipilih pengunjung bisa lenyap saat halaman direvalidasi dan berita
   * terakhirnya diturunkan ke draft; menyimpannya di state berarti komponen
   * menunjuk kategori yang tidak ada lagi.
   */
  const currentTab = activeTab && articlesByCategory.has(activeTab) ? activeTab : availableTabs[0]?.key
  const categoryArticles = currentTab
    ? (articlesByCategory.get(currentTab) ?? []).slice(0, MAX_STORIES_PER_CATEGORY)
    : []
  const safeIndex = Math.min(activeIndex, Math.max(categoryArticles.length - 1, 0))
  const activeArticle = categoryArticles[safeIndex]
  const currentTabLabel = availableTabs.find((tab) => tab.key === currentTab)?.label

  function selectCategory(category: ArticleCategoryKey) {
    setActiveTab(category)
    setActiveIndex(0)
  }

  function handleTabKeydown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = availableTabs.length - 1
    let nextTabIndex: number | null = null

    if (event.key === 'ArrowRight') nextTabIndex = index === lastIndex ? 0 : index + 1
    else if (event.key === 'ArrowLeft') nextTabIndex = index === 0 ? lastIndex : index - 1
    else if (event.key === 'Home') nextTabIndex = 0
    else if (event.key === 'End') nextTabIndex = lastIndex

    if (nextTabIndex === null) return

    event.preventDefault()
    selectCategory(availableTabs[nextTabIndex].key)
    tabRefs.current[nextTabIndex]?.focus()
  }

  if (!activeArticle || !currentTab) {
    return (
      <section className="newsroom" id="kabar" aria-labelledby="news-deck-title">
        <div className="newsroom-shell">
          <header className="newsroom-masthead">
            <div>
              <p className="newsroom-kicker">{fields.kicker}</p>
              <h2 id="news-deck-title">{fields.emptyTitle}</h2>
              <p className="newsroom-standfirst">{fields.emptyLead}</p>
            </div>
            <Link className="newsroom-index-link" href="/agenda">
              {fields.emptyIndexAction}
            </Link>
          </header>

          <div className="newsroom-empty">
            <p>{fields.emptyBody}</p>
            <div>
              <Link href="/program-kerja">{fields.emptyPrimaryAction}</Link>
              <Link href="/agenda">{fields.emptySecondaryAction}</Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="newsroom" id="kabar" aria-labelledby="news-deck-title">
      <div className="newsroom-shell">
        <header className="newsroom-masthead">
          <div>
            <p className="newsroom-kicker">{fields.kicker}</p>
            <h2 id="news-deck-title">{fields.publishedTitle}</h2>
            <p className="newsroom-standfirst">{fields.publishedLead}</p>
          </div>
          <Link className="newsroom-index-link" href="/berita">
            {fields.publishedAction}
          </Link>
        </header>

        {availableTabs.length > 1 ? (
          <div className="newsroom-tabs" role="tablist" aria-label="Kategori berita">
            {availableTabs.map((tab, index) => {
              const isActive = tab.key === currentTab

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
        ) : null}

        <div className="newsroom-body" data-solo={categoryArticles.length < 2 ? '' : undefined}>
          <article className="newsroom-story" key={`${currentTab}-${activeArticle.slug}`}>
            {/*
              Berita tanpa sampul ditandai supaya bidang abstraknya bisa
              diredam. Bentuk yang sama dipakai di /berita dengan bobot penuh,
              tapi di sini bidangnya 780×489 dan langsung jadi benda terbesar
              di seksi — placeholder yang lebih menarik perhatian daripada
              beritanya sendiri.
            */}
            <Link
              className="newsroom-story-media"
              data-placeholder={activeArticle.image ? undefined : ''}
              href={`/berita/${activeArticle.slug}`}
              tabIndex={-1}
              aria-hidden
            >
              <ArticleCover
                src={activeArticle.image}
                alt=""
                slug={activeArticle.slug}
                sizes="(max-width: 980px) 100vw, 720px"
                decorative
              />
              {/*
                Kelasnya eksplisit, bukan `> span`. <ArticleCover> juga
                merender <span> sebagai anak langsung saat beritanya tidak
                punya foto, dan pemilih elemen membuat sampul cadangan itu
                ikut dipotong jadi pil emas.
              */}
              <span className="newsroom-story-tag">{activeArticle.categoryLabel}</span>
            </Link>

            <div className="newsroom-story-copy">
              <p className="newsroom-story-meta">
                <time dateTime={activeArticle.dateIso || undefined}>{activeArticle.publishedLabel}</time>
                <span>{activeArticle.readTime}</span>
              </p>
              <h3>
                {/*
                  Judulnya sendiri yang jadi tautan, bukan tombol "Baca cerita
                  lengkap" terpisah. Satu berita berarti satu target klik yang
                  jelas, dan pembaca layar mendapat nama tautan yang bermakna
                  tanpa harus menebak "lengkap" itu yang mana.
                */}
                <Link href={`/berita/${activeArticle.slug}`}>{activeArticle.title}</Link>
              </h3>
              <p className="newsroom-story-excerpt">{activeArticle.excerpt}</p>
              <p className="newsroom-story-byline">
                <span>{activeArticle.publisher}</span>
                <Link className="newsroom-story-read" href={`/berita/${activeArticle.slug}`}>
                  {fields.storyAction}
                </Link>
              </p>
            </div>
          </article>

          {categoryArticles.length > 1 ? (
            <aside className="newsroom-more" aria-label="Pilih berita dalam kategori ini">
              <p className="newsroom-more-head">
                <span>{fields.relatedLabel}</span>
                <span>{currentTabLabel}</span>
              </p>

              <div className="newsroom-more-list">
                {categoryArticles.map((article, index) => (
                  <button
                    type="button"
                    className={index === safeIndex ? 'is-active' : undefined}
                    onClick={() => setActiveIndex(index)}
                    aria-pressed={index === safeIndex}
                    key={article.slug}
                  >
                    <i aria-hidden>{String(index + 1).padStart(2, '0')}</i>
                    <strong>{article.title}</strong>
                    <small>{article.publishedLabel}</small>
                  </button>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}
