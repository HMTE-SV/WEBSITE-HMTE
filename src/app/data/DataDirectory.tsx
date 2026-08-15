'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { publicDataCategories, type PublicDataCategory } from '@/lib/public-data'
import type { PublicDataEntry } from '@/lib/public-data-data'

type CategoryFilter = PublicDataCategory | 'all'

export function DataDirectory({ entries }: { entries: PublicDataEntry[] }) {
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('id-ID')
    return entries.filter((entry) => {
      const matchesCategory = category === 'all' || entry.category === category
      const haystack = `${entry.title} ${entry.excerpt} ${entry.period} ${entry.categoryLabel}`.toLocaleLowerCase('id-ID')
      return matchesCategory && (!needle || haystack.includes(needle))
    })
  }, [category, entries, query])

  return (
    <section className="data-hub-directory" aria-labelledby="data-directory-title">
      <div className="public-shell">
        <div className="data-hub-toolbar">
          <div>
            <span>Katalog terbuka</span>
            <h2 id="data-directory-title">Temukan data yang kamu butuhkan.</h2>
          </div>
          <label className="data-hub-search">
            <span className="sr-only">Cari data</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari mahasiswa, penugasan, periode…" />
          </label>
        </div>

        <div className="data-hub-filters" role="group" aria-label="Saring kategori data">
          <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Semua <span>{entries.length}</span></button>
          {publicDataCategories.map((item) => {
            const count = entries.filter((entry) => entry.category === item.value).length
            if (count === 0) return null
            return <button type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)} key={item.value}>{item.label} <span>{count}</span></button>
          })}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="data-hub-empty"><strong>Belum ada data yang cocok.</strong><p>Coba kata kunci atau kategori lain.</p></div>
        ) : (
          <div className="data-hub-grid">
            {filteredEntries.map((entry, index) => (
              <Link className="data-hub-card" href={`/data/${entry.slug}`} key={entry.id}>
                <div className="data-hub-card-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="data-hub-card-main">
                  <div className="data-hub-card-meta"><span>{entry.categoryLabel}</span>{entry.period ? <b>{entry.period}</b> : null}</div>
                  <h3>{entry.title}</h3>
                  <p>{entry.excerpt}</p>
                  <div className="data-hub-card-foot">
                    <span>{entry.resources.length} resource</span>
                    <time dateTime={entry.updatedIso || undefined}>Diperbarui {entry.publishedLabel}</time>
                    <strong>Buka data <b aria-hidden="true">↗</b></strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
