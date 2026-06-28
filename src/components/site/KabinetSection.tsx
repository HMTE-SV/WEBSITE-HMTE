'use client'

import { kabinetIntro } from '@/data/site-content'
import type { Division } from '@/types/content'
import { useDirectory } from './directory/DirectoryProvider'

type KabinetSectionProps = {
  divisions: Division[]
}

export function KabinetSection({ divisions }: KabinetSectionProps) {
  const { selectDivision } = useDirectory()

  return (
    <section className="tre-pillars" id="pillars">
      <div className="pillars-shell">
        <header className="pillars-head fade-up">
          <h2 className="pillars-h2">
            {kabinetIntro.title}
            <span className="muted">{kabinetIntro.mutedTitle}</span>
            <span className="acc">.</span>
          </h2>
          <p className="pillars-lead">{kabinetIntro.lead}</p>
        </header>

        <div className="kabinet-grid">
          {divisions.map((division) => (
            <button
              type="button"
              className="kabinet-card fade-up"
              key={division.code}
              onClick={() => selectDivision(division.code, { scroll: true })}
              aria-label={`Lihat anggota bidang ${division.name}`}
            >
              <div className="kabinet-card-top">
                <span className="kabinet-abbr">{division.shortName}</span>
                <span className="kabinet-num">{String(division.order).padStart(2, '0')}</span>
              </div>
              <h3 className="kabinet-name">{division.name}</h3>
              <p className="kabinet-desc">{division.description}</p>
              <div className="kabinet-footer">
                <span className="kabinet-dot"></span>
                <span>
                  Lihat Anggota{' '}
                  <span className="kabinet-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
