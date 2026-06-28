'use client'

import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { DirectoryProvider } from './directory/DirectoryProvider'
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
      <KabinetSection divisions={divisions} />
      <LeadershipDirectory
        divisionsByCode={divisionsByCode}
        leadersByDivision={leadersByDivision}
        programsByDivision={programsByDivision}
      />
      <MemberDetailModal />
    </DirectoryProvider>
  )
}
