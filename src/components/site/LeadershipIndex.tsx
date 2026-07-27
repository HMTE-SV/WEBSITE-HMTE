'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { getLeaderHref } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Leader } from '@/types/content'

/*
 * Direktori pengurus untuk /kepengurusan.
 *
 * Bentuknya daftar berkelompok, bukan grid kartu kecil. Alasannya: 71 kartu
 * berukuran kartu nama menghasilkan 71 kotak dalam satu layar, dan itu yang
 * bikin halaman terasa ramai sekaligus sempit. Nama orang adalah baris teks,
 * dan baris teks paling terbaca sebagai daftar.
 *
 * Struktur dibawa oleh permukaan, bukan garis: satu kartu putih membulat per
 * bidang, di atas latar cekung. Warna bidang membawa wayfinding.
 *
 * Hierarki jabatan ditandai lewat ISI avatar, bukan lewat ukuran kartu atau
 * garis tambahan: jabatan inti memakai avatar pejal berwarna bidangnya,
 * anggota lain memakai avatar bernada. Semua baris tetap setinggi sama.
 */

type LeadershipIndexProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  /** Dari ?divisi=. Filter awal, bukan tab awal. */
  initialDivision?: DivisionCode | null
}

const CORE_ROLE = /^(ketua umum|sekretaris jendral|bendahara|kepala divisi)/i

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? '')

  return `${first}${second}`.toUpperCase()
}

export function LeadershipIndex({
  divisions,
  leadersByDivision,
  initialDivision = null,
}: LeadershipIndexProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | null>(initialDivision)
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')

  const groups = useMemo(
    () =>
      divisions
        .filter((division) => activeDivision === null || division.code === activeDivision)
        .map((division) => ({
          division,
          leaders: leadersByDivision[division.code].filter(
            (leader) =>
              normalizedQuery.length === 0 ||
              `${leader.name} ${leader.role} ${leader.batch ?? ''}`
                .toLocaleLowerCase('id-ID')
                .includes(normalizedQuery),
          ),
        }))
        .filter((group) => group.leaders.length > 0),
    [activeDivision, divisions, leadersByDivision, normalizedQuery],
  )

  const totalVisible = groups.reduce((total, group) => total + group.leaders.length, 0)

  function selectDivision(code: DivisionCode | null) {
    setActiveDivision(code)
    // Query sengaja TIDAK dikosongkan. Mengganti bidang saat sedang mencari
    // adalah cara mempersempit hasil, bukan alasan membuang pencariannya.
  }

  return (
    <div className="ppl">
      <div className="ppl-toolbar">
        <div className="soft-pills" role="group" aria-label="Saring menurut bidang">
          <button
            type="button"
            className={activeDivision === null ? 'is-active' : undefined}
            aria-pressed={activeDivision === null}
            onClick={() => selectDivision(null)}
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
              onClick={() => selectDivision(activeDivision === division.code ? null : division.code)}
              title={division.name}
            >
              <i aria-hidden="true" />
              {division.shortName}
            </button>
          ))}
        </div>

        <div className="ppl-toolbar-side">
          <label className="soft-search">
            <span className="sr-only">Cari pengurus di seluruh bidang</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau jabatan"
            />
          </label>
          <p className="ppl-count" role="status">
            {totalVisible} orang
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="soft-empty">
          <strong>Nama tidak ditemukan</strong>
          <p>Coba kata kunci lain, atau hapus pencarian untuk melihat semua pengurus.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveDivision(null)
            }}
          >
            Hapus pencarian
          </button>
        </div>
      ) : (
        <div className="ppl-columns">
          {groups.map(({ division, leaders }) => (
            <section className="ppl-group sfc" key={division.code} data-div={division.code}>
              <header className="ppl-group-head">
                {/* Angka, bukan potongan dua huruf dari nama bidang. "KO" dan
                    "PS" tidak berarti apa-apa; jumlah anggota berarti. */}
                <span className="ppl-group-mark" aria-hidden="true">
                  {leaders.length}
                </span>
                <span className="ppl-group-copy">
                  <h2>{division.name}</h2>
                  <small>{division.shortName}</small>
                </span>
              </header>

              <ul className="ppl-list">
                {leaders.map((leader) => (
                  <li key={`${division.code}-${leader.name}`}>
                    <Link className="ppl-row" href={getLeaderHref(leader)}>
                      <span
                        className="ppl-avatar"
                        data-core={CORE_ROLE.test(leader.role)}
                        aria-hidden="true"
                      >
                        {getInitials(leader.name)}
                      </span>
                      <span className="ppl-copy">
                        <strong>{leader.name}</strong>
                        <small>
                          {leader.role}
                          {leader.batch ? ` · ${leader.batch}` : ''}
                        </small>
                      </span>
                      <span className="ppl-chev" aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
