'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { isFeaturedProgram } from '@/data/featured-programs'
import { getProgramHref } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Program, ProgramStatus } from '@/types/content'

type ProgramCatalogProps = {
  divisions: Division[]
  programsByDivision: Record<DivisionCode, Program[]>
}

type CatalogProgram = Program & {
  divisionCode: DivisionCode
  divisionName: string
  divisionShortName: string
  featured: boolean
}

type StatusFilter = ProgramStatus | 'ALL'

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Semua pola', value: 'ALL' },
  { label: 'Terjadwal', value: 'Terjadwal' },
  { label: 'Berkala', value: 'Berkala' },
]

function getStatusClass(status: ProgramStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

export function ProgramCatalog({ divisions, programsByDivision }: ProgramCatalogProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | 'ALL'>('ALL')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL')
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
        })),
      ),
    [divisions, programsByDivision],
  )

  const visiblePrograms = useMemo(
    () =>
      programs.filter((program) => {
        const matchesDivision = activeDivision === 'ALL' || program.divisionCode === activeDivision
        const matchesStatus = activeStatus === 'ALL' || program.status === activeStatus
        const matchesQuery =
          deferredQuery.length === 0 ||
          `${program.name} ${program.desc} ${program.divisionName}`.toLowerCase().includes(deferredQuery)

        return matchesDivision && matchesStatus && matchesQuery
      }),
    [activeDivision, activeStatus, deferredQuery, programs],
  )

  function resetFilters() {
    setActiveDivision('ALL')
    setActiveStatus('ALL')
    setQuery('')
  }

  return (
    <div className="program-ledger">
      <div className="ledger-toolbar">
        <div>
          <p className="org-eyebrow">Buku agenda</p>
          <h2 id="catalog-title">
            Semua program <em>kerja.</em>
          </h2>
        </div>
        <div className="ledger-toolbar-side">
          <label className="roster-search">
            <span className="sr-only">Cari program kerja</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau deskripsi program"
            />
          </label>
          <span className="ledger-result">
            {visiblePrograms.length} / {programs.length} program
          </span>
        </div>
      </div>

      <div className="ledger-filters">
        <div className="ledger-filter-group" role="group" aria-label="Filter bidang program kerja">
          <button
            type="button"
            className={activeDivision === 'ALL' ? 'is-active' : undefined}
            aria-pressed={activeDivision === 'ALL'}
            onClick={() => setActiveDivision('ALL')}
          >
            Semua bidang
          </button>
          {divisions.map((division) => (
            <button
              type="button"
              className={activeDivision === division.code ? 'is-active' : undefined}
              aria-pressed={activeDivision === division.code}
              onClick={() => setActiveDivision(division.code)}
              key={division.code}
            >
              {division.shortName}
            </button>
          ))}
        </div>

        <div className="ledger-filter-group" role="group" aria-label="Filter pola jadwal program kerja">
          {statusOptions.map((option) => (
            <button
              type="button"
              className={activeStatus === option.value ? 'is-active' : undefined}
              aria-pressed={activeStatus === option.value}
              onClick={() => setActiveStatus(option.value)}
              key={option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visiblePrograms.length > 0 ? (
        <div className="ledger-list">
          {visiblePrograms.map((program, index) => (
            <Link
              className="ledger-row"
              href={getProgramHref(program)}
              aria-label={`Buka detail ${program.name}`}
              key={`${program.divisionCode}-${program.name}`}
            >
              <span className="ledger-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="ledger-main">
                <div>
                  <span>{program.divisionShortName}</span>
                  {program.featured ? <strong>Unggulan</strong> : null}
                </div>
                <h3>{program.name}</h3>
                <p>{program.desc}</p>
              </div>
              <div className="ledger-side">
                <span className={`org-status ${getStatusClass(program.status)}`}>
                  <i aria-hidden="true" />
                  {program.status}
                </span>
                <time>{program.date}</time>
                <span className="ledger-open">Buka detail ↗</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="ledger-empty">
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
