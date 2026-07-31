'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { DateBadge } from './DateBadge'
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
 * Tiga versi sebelumnya gagal dengan cara yang sama: 37 program digambar sebagai
 * 37 objek seragam, entah baris ledger, kartu bergaris, atau kartu putih lega.
 * Yang bikin lelah bukan bentuk kartunya, melainkan tidak adanya satu pun
 * pembeda di antara tiga puluh tujuh benda yang identik.
 *
 * Sekarang katalog ini adalah REGISTER berkelompok. Program masuk ke bidangnya,
 * dan tiap bidang dibuka satu palang berwarna miliknya sendiri. Menggulir
 * katalog berarti melewati delapan pita warna, bukan satu tembok putih. Barisnya
 * dibuat padat, bukan dilegakan: tiga puluh tujuh benda yang harus dibandingkan
 * memang lebih baik dibaca sebagai daftar daripada sebagai kartu.
 *
 * Pilihan "Abjad" dibuang. Tidak ada satu pun pertanyaan nyata yang dijawab
 * dengan mengurutkan program kerja menurut huruf pertamanya.
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
  schedule: ProgramSchedule
}

type StatusFilter = ProgramStatus | 'ALL'
type ViewMode = 'bidang' | 'waktu'

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Semua pola', value: 'ALL' },
  { label: 'Terjadwal', value: 'Terjadwal' },
  { label: 'Berkala', value: 'Berkala' },
]

const viewOptions: Array<{ label: string; value: ViewMode }> = [
  { label: 'Per bidang', value: 'bidang' },
  { label: 'Urut waktu', value: 'waktu' },
]

/** Program tanpa jadwal turun ke bawah, bukan naik karena bandnya kosong. */
function byScheduleThenName(first: CatalogProgram, second: CatalogProgram) {
  return (
    (first.schedule.bands[0]?.from ?? 2) - (second.schedule.bands[0]?.from ?? 2) ||
    first.name.localeCompare(second.name, 'id')
  )
}

export function ProgramCatalog({ divisions, programsByDivision, year }: ProgramCatalogProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | 'ALL'>('ALL')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL')
  const [datedOnly, setDatedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('bidang')
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
          schedule: buildProgramSchedule(program, year),
        })),
      ),
    [divisions, programsByDivision, year],
  )

  const datedCount = useMemo(
    () => programs.filter((program) => program.schedule.precision === 'exact').length,
    [programs],
  )

  const visiblePrograms = useMemo(
    () =>
      programs.filter((program) => {
        const matchesDivision = activeDivision === 'ALL' || program.divisionCode === activeDivision
        const matchesStatus = activeStatus === 'ALL' || program.status === activeStatus
        const matchesDated = !datedOnly || program.schedule.precision === 'exact'
        const matchesQuery =
          deferredQuery.length === 0 ||
          `${program.name} ${program.desc} ${program.divisionName}`
            .toLowerCase()
            .includes(deferredQuery)

        return matchesDivision && matchesStatus && matchesDated && matchesQuery
      }),
    [activeDivision, activeStatus, datedOnly, deferredQuery, programs],
  )

  /*
   * Bidang yang seluruh programnya tersaring habis tidak dibangkitkan sama
   * sekali, jadi katalog tidak pernah menampilkan palang bidang di atas ruang
   * kosong. Urutannya mengikuti `divisions`, yang sudah datang terurut dari
   * halaman, bukan urutan kemunculan program.
   */
  const groups = useMemo(() => {
    if (viewMode !== 'bidang') return []

    return divisions.flatMap((division) => {
      const members = visiblePrograms.filter((program) => program.divisionCode === division.code)
      return members.length > 0 ? [{ division, programs: members }] : []
    })
  }, [divisions, viewMode, visiblePrograms])

  const timeline = useMemo(
    () => (viewMode === 'waktu' ? [...visiblePrograms].sort(byScheduleThenName) : []),
    [viewMode, visiblePrograms],
  )

  function resetFilters() {
    setActiveDivision('ALL')
    setActiveStatus('ALL')
    setDatedOnly(false)
    setQuery('')
  }

  function renderRow(program: CatalogProgram, withDivisionTag: boolean) {
    return (
      <li key={`${program.divisionCode}-${program.name}`}>
        <Link className="pk-row" href={getProgramHref(program)} data-div={program.divisionCode}>
          <DateBadge schedule={program.schedule} />
          <span className="pk-row-copy">
            <strong>{program.name}</strong>
            <small>{program.desc}</small>
          </span>
          <span className="pk-row-meta">
            {withDivisionTag ? (
              <span className="soft-tag">{program.divisionShortName}</span>
            ) : null}
            <span className="soft-tag soft-tag-quiet">{program.status}</span>
            <time dateTime={program.startDate || undefined}>
              {formatScheduleShort(program.schedule)}
            </time>
          </span>
          <span className="pk-row-chev" aria-hidden="true">
            ›
          </span>
        </Link>
      </li>
    )
  }

  return (
    <div className="pk">
      <div className="soft-head">
        <div>
          <h2 id="catalog-title">Semua program kerja.</h2>
          <p className="pk-subhead">
            {programs.length} program dari delapan bidang. {datedCount} di antaranya sudah
            punya tanggal pasti; sisanya baru punya bulan rencana.
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

          <div className="soft-pills" role="group" aria-label="Cara menyusun">
            {viewOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={viewMode === option.value ? 'is-active' : undefined}
                aria-pressed={viewMode === option.value}
                onClick={() => setViewMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visiblePrograms.length === 0 ? (
        <div className="soft-empty">
          <strong>Program tidak ditemukan</strong>
          <p>Coba kata kunci atau kombinasi filter yang berbeda.</p>
          <button type="button" onClick={resetFilters}>
            Reset filter
          </button>
        </div>
      ) : viewMode === 'bidang' ? (
        <div className="pk-register">
          {groups.map(({ division, programs: members }) => (
            <section className="pk-group" key={division.code} data-div={division.code}>
              <header className="pk-group-head">
                <span className="pk-group-mark">{division.shortName}</span>
                <div>
                  <h3>{division.name}</h3>
                  <p>
                    {members.length} program
                    {members.length !== programsByDivision[division.code].length
                      ? ` dari ${programsByDivision[division.code].length}`
                      : ''}
                  </p>
                </div>
              </header>
              <ul className="pk-rows">
                {members.map((program) => renderRow(program, false))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="pk-register">
          <section className="pk-group pk-group-flat">
            <ul className="pk-rows">{timeline.map((program) => renderRow(program, true))}</ul>
          </section>
        </div>
      )}
    </div>
  )
}
