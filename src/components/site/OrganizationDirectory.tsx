'use client'

import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { LogoMark } from './Brand'
import { DirectoryProvider, useDirectory } from './directory/DirectoryProvider'
import { KabinetSection } from './KabinetSection'
import { LeadershipDirectory } from './LeadershipDirectory'
import { MemberDetailModal } from './MemberDetailModal'

type OrganizationDirectoryProps = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

/**
 * Client island for the homepage organization sections. The kabinet grid, the
 * leadership directory, and the member modal share one DirectoryProvider so a
 * click on a bidang card scrolls into the directory and selects it, and a click
 * on a member opens the modal — all without the old eval-script DOM glue.
 */
export function OrganizationDirectory({
  divisions,
  divisionsByCode,
  leadersByDivision,
  programsByDivision,
}: OrganizationDirectoryProps) {
  return (
    <DirectoryProvider>
      <OrganizationExperience
        divisions={divisions}
        divisionsByCode={divisionsByCode}
        leadersByDivision={leadersByDivision}
        programsByDivision={programsByDivision}
      />
      <MemberDetailModal />
    </DirectoryProvider>
  )
}

function OrganizationExperience({
  divisions,
  divisionsByCode,
  leadersByDivision,
  programsByDivision,
}: OrganizationDirectoryProps) {
  const { selectedDivision, directoryStage, transitionKey } = useDirectory()
  const division = divisionsByCode[selectedDivision]

  return (
    <section className="organization-experience" id="pillars">
      <KabinetSection divisions={divisions} />

      <div
        className={`organization-reveal is-${directoryStage}`}
        id="division-reveal"
        aria-live="polite"
      >
        <div className="organization-confirmation" key={transitionKey}>
          <div className="organization-confirmation-orbit" aria-hidden="true">
            <LogoMark width={58} height={34} className="organization-confirmation-logo" />
          </div>
          <div className="organization-confirmation-copy">
            <span>{directoryStage === 'confirming' ? 'Bidang dipilih' : 'Direktori aktif'}</span>
            <p>{division.name}</p>
          </div>
          <span className="organization-confirmation-line" aria-hidden="true"></span>
        </div>

        <div
          className="organization-workspace-frame"
          id="division-workspace"
          aria-hidden={directoryStage !== 'open'}
          inert={directoryStage !== 'open'}
        >
          <div className="organization-workspace-inner">
            <LeadershipDirectory
              key={selectedDivision}
              divisionsByCode={divisionsByCode}
              leadersByDivision={leadersByDivision}
              programsByDivision={programsByDivision}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
