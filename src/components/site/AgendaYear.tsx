'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

/*
 * The year board for /agenda.
 *
 * Programs in the Buku Panduan are scheduled by *month*, never by date, so a
 * day-grid calendar would invent precision the source does not have. This is a
 * twelve-month matrix instead: pick a month or a bidang, and every programme
 * shows which months it actually occupies. Recurring programmes read as a run
 * of marks across the year, which a day calendar could never show.
 */

export type AgendaEntry = {
  id: string
  title: string
  desc: string
  href: string
  divisionCode: string
  divisionShort: string
  cadence: string
  months: number[]
  dateLabel: string
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

type AgendaYearProps = {
  entries: AgendaEntry[]
  divisions: { code: string; shortName: string; name: string }[]
}

export function AgendaYear({ entries, divisions }: AgendaYearProps) {
  const [month, setMonth] = useState<number | null>(null)
  const [division, setDivision] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const byDivision = useMemo(
    () => (division ? entries.filter((entry) => entry.divisionCode === division) : entries),
    [entries, division],
  )

  // Counts follow the bidang filter so the ribbon always describes what is on screen.
  const monthCounts = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0)
    byDivision.forEach((entry) => {
      entry.months.forEach((value) => {
        if (value >= 1 && value <= 12) counts[value - 1] += 1
      })
    })
    return counts
  }, [byDivision])

  const peak = Math.max(...monthCounts, 1)

  const visible = useMemo(
    () => (month ? byDivision.filter((entry) => entry.months.includes(month)) : byDivision),
    [byDivision, month],
  )

  const busiest = monthCounts.indexOf(Math.max(...monthCounts))

  function resetAll() {
    setMonth(null)
    setDivision(null)
    setOpenId(null)
  }

  const isFiltered = month !== null || division !== null

  return (
    <div className="agenda-year">
      <div className="agenda-year-controls">
        <div className="agenda-filter" role="group" aria-label="Saring menurut bidang">
          <button
            type="button"
            className={division === null ? 'is-active' : undefined}
            aria-pressed={division === null}
            onClick={() => setDivision(null)}
          >
            Semua bidang
          </button>
          {divisions.map((item) => (
            <button
              type="button"
              key={item.code}
              className={division === item.code ? 'is-active' : undefined}
              aria-pressed={division === item.code}
              onClick={() => setDivision(division === item.code ? null : item.code)}
              title={item.name}
            >
              {item.shortName}
            </button>
          ))}
        </div>

        <p className="agenda-year-readout" role="status">
          <strong>{String(visible.length).padStart(2, '0')}</strong>
          {month ? ` program di ${MONTHS_LONG[month - 1]}` : ' program sepanjang tahun'}
          {division ? ` · ${division}` : ''}
          {isFiltered && (
            <button type="button" className="agenda-year-reset" onClick={resetAll}>
              Atur ulang
            </button>
          )}
        </p>
      </div>

      <div className="agenda-ribbon" role="group" aria-label="Pilih bulan">
        {MONTHS_SHORT.map((label, index) => {
          const value = index + 1
          const count = monthCounts[index]
          const selected = month === value

          return (
            <button
              type="button"
              key={label}
              className={selected ? 'is-active' : undefined}
              aria-pressed={selected}
              disabled={count === 0}
              onClick={() => setMonth(selected ? null : value)}
              style={{ '--fill': `${Math.round((count / peak) * 100)}%` } as CSSProperties}
            >
              <span className="agenda-ribbon-meter" aria-hidden="true" />
              <span className="agenda-ribbon-label">{label}</span>
              <strong>{String(count).padStart(2, '0')}</strong>
              <span className="sr-only">
                {MONTHS_LONG[index]}, {count} program
                {index === busiest && count > 0 ? ', bulan terpadat' : ''}
              </span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="agenda-year-empty">
          Tidak ada program pada kombinasi filter ini. <button type="button" onClick={resetAll}>Atur ulang</button>
        </p>
      ) : (
        <ul className="agenda-matrix">
          <li className="agenda-matrix-head" aria-hidden="true">
            <span />
            <span />
            <span className="agenda-matrix-strip">
              {MONTHS_SHORT.map((label, index) => (
                <i key={label} className={month === index + 1 ? 'is-active' : undefined}>
                  {label.charAt(0)}
                </i>
              ))}
            </span>
            <span />
          </li>

          {visible.map((entry) => {
            const open = openId === entry.id

            return (
              <li className="agenda-matrix-row" key={entry.id} data-open={open}>
                <button
                  type="button"
                  className="agenda-matrix-trigger"
                  aria-expanded={open}
                  aria-controls={`agenda-detail-${entry.id}`}
                  onClick={() => setOpenId(open ? null : entry.id)}
                >
                  <span className="agenda-matrix-name">
                    {entry.title}
                    <small>{entry.dateLabel}</small>
                  </span>

                  <span className="agenda-matrix-tag">{entry.divisionShort}</span>

                  {/* Decorative: the months are already stated in dateLabel above. */}
                  <span className="agenda-matrix-strip" aria-hidden="true">
                    {MONTHS_SHORT.map((label, index) => {
                      const active = entry.months.includes(index + 1)
                      const classNames = [
                        active ? 'is-on' : '',
                        month === index + 1 ? 'is-focus' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')

                      return <i key={label} className={classNames || undefined} />
                    })}
                  </span>

                  <span className="agenda-matrix-cadence">{entry.cadence}</span>
                </button>

                <div className="agenda-matrix-detail" id={`agenda-detail-${entry.id}`} hidden={!open}>
                  <p>{entry.desc}</p>
                  <Link href={entry.href}>
                    Buka detail program <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
