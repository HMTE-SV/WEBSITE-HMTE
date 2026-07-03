'use client'

import { kabinetIntro } from '@/data/site-content'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { DirectoryProvider, useDirectory } from './directory/DirectoryProvider'
import { LeadershipDirectory } from './LeadershipDirectory'

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
    <nav className="org-switches" aria-label="Pilih bidang atau divisi">
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
  return (
    <DirectoryProvider>
      <section className="org-switchboard" id="pillars" aria-labelledby="org-switchboard-title">
        <div className="org-switchboard-shell">
          <header className="org-switchboard-head">
            <h2 id="org-switchboard-title">
              {kabinetIntro.title}<span>{kabinetIntro.mutedTitle}</span>.
            </h2>
            <p>{kabinetIntro.lead}</p>
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
