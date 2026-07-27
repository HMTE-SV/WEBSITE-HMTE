'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { DateBadge } from './DateBadge'
import { isFeaturedProgram } from '@/data/featured-programs'
import { getProgramHref } from '@/lib/organization-slugs'
import {
  buildProgramSchedule,
  formatScheduleShort,
  type ProgramSchedule,
} from '@/lib/program-schedule'
import type { Division, DivisionCode, Program, ProgramStatus } from '@/types/content'

/*
 * Katalog program kerja untuk /program-kerja.
 *
 * Dua versi sebelumnya gagal karena alasan yang sama dari dua arah: ledger 37
 * baris seragam tidak punya pembeda, lalu grid kartu bergaris menambah 37 rail
 * mini dan justru bikin halaman penuh gambar kecil. Sekarang kartunya lega,
 * tanpa garis, dan waktu dijawab oleh satu badge tanggal yang terbaca.
 */

type ProgramCatalogProps = {
  divisions: Division[]
  programsByDivision: Record<DivisionCode, Program[]>
  /*
   * Diturunkan dari halaman, bukan dibaca sendiri. Tahun papan sekarang tinggal
   * di settings/site, dan komponen ini berjalan di browser: membacanya dari
   * sini berarti satu permintaan Firestore tambahan per pengunjung untuk satu
   * angka yang sudah diketahui server saat merender.
   */
  year: number
}

type CatalogProgram = Program & {
  divisionCode: DivisionCode
  divisionName: string
  divisionShortName: string
  featured: boolean
  schedule: ProgramSchedule
}

type StatusFilter = ProgramStatus | 'ALL'
type SortKey = 'bidang' | 'abjad' | 'waktu'

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Semua pola', value: 'ALL' },
  { label: 'Terjadwal', value: 'Terjadwal' },
  { label: 'Berkala', value: 'Berkala' },
]

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: 'Bidang', value: 'bidang' },
  { label: 'Abjad', value: 'abjad' },
  { label: 'Waktu', value: 'waktu' },
]

export function ProgramCatalog({ divisions, programsByDivision, year }: ProgramCatalogProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | 'ALL'>('ALL')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL')
  const [datedOnly, setDatedOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('bidang')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const programs = useMemo<CatalogProgram[]>(
    () =>
      divisions.flatMap((division) =>
        programsByDivision[division.code].map((program) => ({
          ...program,
          divisionCode: division.code,
          divisionName: division.name,
          divisionShortName: division.shortName,
          featured: isFeaturedProgram(division.code, program.name),
          schedule: buildProgramSchedule(program, year),
        })),
      ),
    [divisions, programsByDivision, year],
  )

  const datedCount = useMemo(
    () => programs.filter((program) => program.schedule.precision === 'exact').length,
    [programs],
  )

  const visiblePrograms = useMemo(() => {
    const filtered = programs.filter((program) => {
      const matchesDivision = activeDivision === 'ALL' || program.divisionCode === activeDivision
      const matchesStatus = activeStatus === 'ALL' || program.status === activeStatus
      const matchesDated = !datedOnly || program.schedule.precision === 'exact'
      const matchesQuery =
        deferredQuery.length === 0 ||
        `${program.name} ${program.desc} ${program.divisionName}`
          .toLowerCase()
          .includes(deferredQuery)

      return matchesDivision && matchesStatus && matchesDated && matchesQuery
    })

    if (sortKey === 'abjad') {
      return [...filtered].sort((first, second) => first.name.localeCompare(second.name, 'id'))
    }

    if (sortKey === 'waktu') {
      // Program tanpa jadwal turun ke bawah, bukan naik ke atas karena bandnya kosong.
      return [...filtered].sort(
        (first, second) =>
          (first.schedule.bands[0]?.from ?? 2) - (second.schedule.bands[0]?.from ?? 2) ||
          first.name.localeCompare(second.name, 'id'),
      )
    }

    return filtered
  }, [activeDivision, activeStatus, datedOnly, deferredQuery, programs, sortKey])

  function resetFilters() {
    setActiveDivision('ALL')
    setActiveStatus('ALL')
    setDatedOnly(false)
    setQuery('')
  }

  return (
    <div className="pk">
      <div className="soft-head">
        <div>
          <h2 id="catalog-title">Semua program kerja.</h2>
          <p className="pk-subhead">
            {programs.length} program dari delapan bidang. {datedCount} di antaranya sudah
            punya tanggal pasti.
          </p>
        </div>
        <label className="soft-search">
          <span className="sr-only">Cari program kerja</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari program"
          />
        </label>
      </div>

      <div className="pk-filters">
        <div className="soft-pills" role="group" aria-label="Filter bidang">
          <button
            type="button"
            className={activeDivision === 'ALL' ? 'is-active' : undefined}
            aria-pressed={activeDivision === 'ALL'}
            onClick={() => setActiveDivision('ALL')}
          >
            Semua
          </button>
          {divisions.map((division) => (
            <button
              type="button"
              key={division.code}
              data-div={division.code}
              className={activeDivision === division.code ? 'is-active' : undefined}
              aria-pressed={activeDivision === division.code}
              onClick={() =>
                setActiveDivision(activeDivision === division.code ? 'ALL' : division.code)
              }
              title={division.name}
            >
              <i aria-hidden="true" />
              {division.shortName}
            </button>
          ))}
        </div>

        <div className="pk-filters-row">
          <div className="soft-pills" role="group" aria-label="Filter pola jadwal">
            {statusOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={activeStatus === option.value ? 'is-active' : undefined}
                aria-pressed={activeStatus === option.value}
                onClick={() => setActiveStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={datedOnly ? 'is-active' : undefined}
              aria-pressed={datedOnly}
              onClick={() => setDatedOnly(!datedOnly)}
            >
              Bertanggal
            </button>
          </div>

          <div className="soft-pills" role="group" aria-label="Urutkan">
            {sortOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={sortKey === option.value ? 'is-active' : undefined}
                aria-pressed={sortKey === option.value}
                onClick={() => setSortKey(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visiblePrograms.length > 0 ? (
        <div className="pk-grid">
          {visiblePrograms.map((program) => (
            <Link
              className="pk-card sfc"
              href={getProgramHref(program)}
              key={`${program.divisionCode}-${program.name}`}
              data-div={program.divisionCode}
            >
              <span className="pk-card-top">
                <DateBadge schedule={program.schedule} />
                <span className="pk-card-meta">
                  <span className="soft-tag">{program.divisionShortName}</span>
                  {program.featured && <span className="pk-star" aria-label="Program unggulan">★</span>}
                </span>
              </span>

              <h3>{program.name}</h3>
              <p>{program.desc}</p>

              <span className="pk-card-foot">
                <span className="soft-tag soft-tag-quiet">{program.status}</span>
                <time dateTime={program.startDate}>{formatScheduleShort(program.schedule)}</time>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="soft-empty">
          <strong>Program tidak ditemukan</strong>
          <p>Coba kata kunci atau kombinasi filter yang berbeda.</p>
          <button type="button" onClick={resetFilters}>
            Reset filter
          </button>
        </div>
      )}
    </div>
  )
}
