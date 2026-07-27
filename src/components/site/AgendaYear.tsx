'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { DateBadge } from './DateBadge'
import { MONTH_NAMES_LONG, MONTH_NAMES_SHORT, type ProgramSchedule } from '@/lib/program-schedule'

/*
 * Peta tahun untuk /agenda.
 *
 * Versi sebelumnya menggambar satu rail dua belas bulan untuk SETIAP program:
 * tiga puluh tujuh gambar garis kecil dalam satu layar, tidak satu pun terbaca
 * sekilas. Sekarang visualisasi tahun cuma ada SATU, yaitu dua belas tegel
 * bulan di bawah ini, dan di bawahnya isi bulan terpilih ditulis sebagai
 * daftar biasa dengan tanggal yang benar-benar terbaca.
 *
 * Kepadatan bulan dibawa oleh titik berwarna, satu titik satu program, dengan
 * warna bidangnya. Titik itu sekaligus menjawab "bidang mana yang sibuk bulan
 * ini" tanpa perlu legenda terpisah.
 */

export type AgendaEntry = {
  id: string
  title: string
  desc: string
  href: string
  divisionCode: string
  divisionShort: string
  cadence: string
  schedule: ProgramSchedule
}

type AgendaYearProps = {
  entries: AgendaEntry[]
  divisions: { code: string; shortName: string; name: string }[]
  /** Bulan yang terbuka saat halaman dimuat. */
  initialMonth: number
  /** Bulan berjalan, atau null kalau papan bukan tahun berjalan. */
  currentMonth: number | null
}

/** Titik di tegel bulan dibatasi supaya tegelnya tidak tumbuh mengikuti isi. */
const MAX_DOTS = 10

export function AgendaYear({ entries, divisions, initialMonth, currentMonth }: AgendaYearProps) {
  const [month, setMonth] = useState(initialMonth)
  const [division, setDivision] = useState<string | null>(null)

  const scoped = useMemo(
    () => (division ? entries.filter((entry) => entry.divisionCode === division) : entries),
    [entries, division],
  )

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const value = index + 1
        const inMonth = scoped.filter((entry) => entry.schedule.months.includes(value))

        return {
          value,
          total: inMonth.length,
          dated: inMonth.filter((entry) => entry.schedule.precision === 'exact').length,
          dots: inMonth.slice(0, MAX_DOTS).map((entry) => entry.divisionCode),
        }
      }),
    [scoped],
  )

  const selected = useMemo(() => {
    const inMonth = scoped.filter((entry) => entry.schedule.months.includes(month))

    return {
      dated: inMonth
        .filter((entry) => entry.schedule.precision === 'exact')
        .sort(
          (first, second) =>
            (first.schedule.startDate?.getTime() ?? 0) -
            (second.schedule.startDate?.getTime() ?? 0),
        ),
      planned: inMonth
        .filter((entry) => entry.schedule.precision !== 'exact')
        .sort((first, second) => first.title.localeCompare(second.title, 'id')),
    }
  }, [scoped, month])

  const total = selected.dated.length + selected.planned.length

  return (
    <div className="ag">
      <div className="ag-filter">
        <div className="soft-pills" role="group" aria-label="Saring menurut bidang">
          <button
            type="button"
            className={division === null ? 'is-active' : undefined}
            aria-pressed={division === null}
            onClick={() => setDivision(null)}
          >
            Semua
          </button>
          {divisions.map((item) => (
            <button
              type="button"
              key={item.code}
              data-div={item.code}
              className={division === item.code ? 'is-active' : undefined}
              aria-pressed={division === item.code}
              onClick={() => setDivision(division === item.code ? null : item.code)}
              title={item.name}
            >
              <i aria-hidden="true" />
              {item.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="ag-year" role="group" aria-label="Pilih bulan">
        {months.map((item) => (
          <button
            type="button"
            key={item.value}
            className="ag-month"
            data-active={month === item.value}
            data-now={currentMonth === item.value}
            aria-pressed={month === item.value}
            onClick={() => setMonth(item.value)}
          >
            <span className="ag-month-name">
              {MONTH_NAMES_SHORT[item.value - 1]}
              {currentMonth === item.value && <em>Kini</em>}
            </span>
            <span className="ag-month-count">{item.total}</span>
            <span className="ag-month-dots" aria-hidden="true">
              {item.dots.map((code, index) => (
                <i key={`${code}-${index}`} data-div={code} />
              ))}
            </span>
            <span className="sr-only">
              {MONTH_NAMES_LONG[item.value - 1]}, {item.total} program, {item.dated} bertanggal
              pasti
            </span>
          </button>
        ))}
      </div>

      <section className="ag-detail sfc" aria-live="polite">
        <header className="ag-detail-head">
          <h3>{MONTH_NAMES_LONG[month - 1]}</h3>
          <p>
            {total === 0
              ? 'Tidak ada program pada bulan ini'
              : `${total} program · ${selected.dated.length} bertanggal pasti`}
          </p>
        </header>

        {total === 0 ? (
          <p className="ag-detail-empty">
            Belum ada program yang dijadwalkan di bulan ini untuk saringan yang dipilih.
          </p>
        ) : (
          <div className="ag-detail-body">
            {selected.dated.length > 0 && (
              <div className="ag-detail-group">
                <h4>Tanggal sudah pasti</h4>
                <ul className="ag-list">
                  {selected.dated.map((entry) => (
                    <AgendaRow entry={entry} key={entry.id} month={month} />
                  ))}
                </ul>
              </div>
            )}

            {selected.planned.length > 0 && (
              <div className="ag-detail-group">
                <h4>Direncanakan, tanggal belum ditetapkan</h4>
                <ul className="ag-list">
                  {selected.planned.map((entry) => (
                    <AgendaRow entry={entry} key={entry.id} month={month} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function AgendaRow({ entry, month }: { entry: AgendaEntry; month: number }) {
  return (
    <li data-div={entry.divisionCode}>
      <Link className="ag-row" href={entry.href}>
        <DateBadge schedule={entry.schedule} contextMonth={month} />
        <span className="ag-row-copy">
          <strong>{entry.title}</strong>
          <small>{entry.desc}</small>
          <span className="ag-row-meta">
            <span className="soft-tag">{entry.divisionShort}</span>
            <span className="soft-tag soft-tag-quiet">{entry.cadence}</span>
          </span>
        </span>
        <span className="ag-row-chev" aria-hidden="true">
          ›
        </span>
      </Link>
    </li>
  )
}
