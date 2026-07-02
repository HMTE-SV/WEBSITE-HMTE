'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { getLeaderHref } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Leader } from '@/types/content'

type LeadershipIndexProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  initialDivision?: DivisionCode | 'ALL'
}

export function LeadershipIndex({
  divisions,
  leadersByDivision,
  initialDivision = 'ALL',
}: LeadershipIndexProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | 'ALL'>(initialDivision)
  const [query, setQuery] = useState('')

  const allLeaders = useMemo(
    () =>
      divisions.flatMap((division) =>
        leadersByDivision[division.code].map((leader) => ({
          ...leader,
          divisionCode: division.code,
          divisionName: division.name,
          divisionShortName: division.shortName,
        })),
      ),
    [divisions, leadersByDivision],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const visibleLeaders = allLeaders.filter((leader) => {
    const matchesDivision = activeDivision === 'ALL' || leader.divisionCode === activeDivision
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${leader.name} ${leader.role} ${leader.divisionName}`.toLowerCase().includes(normalizedQuery)

    return matchesDivision && matchesQuery
  })

  return (
    <div className="leadership-index">
      <div className="leadership-index-toolbar">
        <div>
          <span className="public-label">Direktori aktif</span>
          <strong>{visibleLeaders.length} pengurus ditemukan</strong>
        </div>
        <label className="leadership-index-search">
          <span className="sr-only">Cari pengurus</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, jabatan, atau bidang"
          />
        </label>
      </div>

      <div className="leadership-index-filters" role="group" aria-label="Filter bidang pengurus">
        <button
          type="button"
          className={activeDivision === 'ALL' ? 'is-active' : undefined}
          aria-pressed={activeDivision === 'ALL'}
          onClick={() => setActiveDivision('ALL')}
        >
          Semua
          <span>{allLeaders.length}</span>
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
            <span>{leadersByDivision[division.code].length}</span>
          </button>
        ))}
      </div>

      {visibleLeaders.length > 0 ? (
        <div className="leadership-index-grid">
          {visibleLeaders.map((leader) => (
            <Link className="leadership-index-card" href={getLeaderHref(leader)} key={`${leader.divisionCode}-${leader.name}`}>
              <div className="leadership-index-photo">
                {leader.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="organization-person-photo" src={leader.photo} alt={leader.name} />
                ) : (
                  <Image className="organization-logo-fallback" src="/assets/logo-hmte.svg" alt="" width={120} height={54} />
                )}
              </div>
              <div className="leadership-index-card-copy">
                <span>{leader.divisionShortName}</span>
                <h2>{leader.name}</h2>
                <p>{leader.role}</p>
              </div>
              <span className="leadership-index-card-action">Lihat profil</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="organization-empty-state">
          <strong>Pengurus tidak ditemukan</strong>
          <p>Coba kata kunci lain atau pilih semua bidang.</p>
        </div>
      )}
    </div>
  )
}
