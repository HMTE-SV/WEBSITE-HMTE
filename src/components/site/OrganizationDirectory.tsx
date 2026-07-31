'use client'

import Link from 'next/link'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { interpolatePageText } from '@/lib/page-content'
import { formatCabinetTitle } from '@/lib/site-settings'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { DirectoryProvider, useDirectory } from './directory/DirectoryProvider'
import { LeadershipDirectory } from './LeadershipDirectory'

/*
 * Seksi Pengurus Harian & departemen.
 *
 * Kepalanya memakai irama yang sama dengan seksi kabar di atasnya: kicker mono,
 * judul sedang, satu paragraf konteks, satu tautan. Sebelumnya judulnya 96px
 * dengan paragraf terlempar ke kolom kanan berjarak 120px, jadi dua bagian yang
 * saling menjelaskan itu terbaca sebagai dua benda yang tidak berhubungan —
 * dan panel navy di bawahnya baru mulai setelah 340px pertama terpakai habis.
 */

type OrganizationDirectoryProps = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

function DivisionSwitches({ divisions }: { divisions: Division[] }) {
  const { selectedDivision, selectDivision } = useDirectory()
  const executive = divisions.find((division) => division.code === 'PH')
  const fields = divisions.filter((division) => division.code !== 'PH')
  const ordered = executive ? [executive, ...fields] : fields

  return (
    <nav className="org-switches" aria-label="Pilih Pengurus Harian atau departemen">
      {ordered.map((division, index) => {
        const isSelected = selectedDivision === division.code

        return (
          <button
            type="button"
            className={isSelected ? 'is-active' : undefined}
            key={division.code}
            onClick={() => selectDivision(division.code)}
            aria-pressed={isSelected}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{division.shortName}</strong>
            <small>{division.name}</small>
          </button>
        )
      })}
    </nav>
  )
}

export function OrganizationDirectory(props: OrganizationDirectoryProps) {
  const { fields } = usePageSection('organization')
  const settings = useSiteSettings()
  return (
    <DirectoryProvider>
      <section className="org-switchboard" id="pillars" aria-labelledby="org-switchboard-title">
        <div className="org-switchboard-shell">
          <header className="org-switchboard-head">
            <div>
              <p className="org-switchboard-kicker">{fields.kicker} · {props.divisions.length} unsur</p>
              <h2 id="org-switchboard-title">
                {fields.title}<span>{fields.mutedTitle}</span>.
              </h2>
              <p className="org-switchboard-standfirst">{interpolatePageText(fields.lead, { cabinet: formatCabinetTitle(settings) })}</p>
            </div>
            <Link className="org-switchboard-index-link" href="/kepengurusan">
              {fields.action}
            </Link>
          </header>

          <div className="org-switchboard-body" id="division-showcase">
            <DivisionSwitches divisions={props.divisions} />
            <LeadershipDirectory {...props} />
          </div>
        </div>
      </section>
    </DirectoryProvider>
  )
}
