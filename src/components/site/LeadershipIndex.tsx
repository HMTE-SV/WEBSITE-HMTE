'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { getLeaderHref } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Leader } from '@/types/content'

type LeadershipIndexProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  initialDivision?: DivisionCode
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '')

  return `${first}${second}`.toUpperCase()
}

export function LeadershipIndex({
  divisions,
  leadersByDivision,
  initialDivision = 'PH',
}: LeadershipIndexProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode>(initialDivision)
  const [query, setQuery] = useState('')

  const activeDivisionData =
    divisions.find((division) => division.code === activeDivision) ?? divisions[0]
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')
  const visibleLeaders = useMemo(
    () =>
      leadersByDivision[activeDivisionData.code].filter(
        (leader) =>
          normalizedQuery.length === 0 ||
          `${leader.name} ${leader.role} ${leader.batch ?? ''}`
            .toLocaleLowerCase('id-ID')
            .includes(normalizedQuery),
      ),
    [activeDivisionData.code, leadersByDivision, normalizedQuery],
  )

  function selectDivision(code: DivisionCode) {
    setActiveDivision(code)
    setQuery('')
  }

  return (
    <div className="leadership-roster">
      <div className="roster-tabs" role="tablist" aria-label="Pilih bidang pengurus">
        {divisions.map((division) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeDivision === division.code}
            className={activeDivision === division.code ? 'is-active' : undefined}
            onClick={() => selectDivision(division.code)}
            key={division.code}
          >
            <span>{division.shortName}</span>
            <strong>{leadersByDivision[division.code].length}</strong>
          </button>
        ))}
      </div>

      <div className="roster-toolbar">
        <div className="roster-count">
          <span>{activeDivisionData.shortName}</span>
          <strong>{activeDivisionData.name}</strong>
          <small>{visibleLeaders.length} anggota ditampilkan</small>
        </div>
        <label className="roster-search">
          <span className="sr-only">Cari anggota di {activeDivisionData.shortName}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Cari di ${activeDivisionData.shortName}`}
          />
        </label>
      </div>

      {visibleLeaders.length > 0 ? (
        <div className="roster-grid" role="tabpanel" aria-label={activeDivisionData.name}>
          {visibleLeaders.map((leader) => (
            <Link
              className="roster-person"
              href={getLeaderHref(leader)}
              key={`${activeDivisionData.code}-${leader.name}`}
            >
              <span className="roster-monogram" aria-hidden="true">
                {leader.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={leader.photo} alt="" />
                ) : (
                  getInitials(leader.name)
                )}
              </span>
              <span className="roster-person-copy">
                <strong>{leader.name}</strong>
                <small>
                  {leader.role}
                  {leader.batch ? ` · ${leader.batch}` : ''}
                </small>
              </span>
              <b aria-hidden="true">↗</b>
            </Link>
          ))}
        </div>
      ) : (
        <div className="roster-empty">
          <strong>Nama tidak ditemukan</strong>
          <p>Coba kata kunci lain atau hapus pencarian.</p>
          <button type="button" onClick={() => setQuery('')}>
            Hapus pencarian
          </button>
        </div>
      )}
    </div>
  )
}
