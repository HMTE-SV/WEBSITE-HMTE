'use client'

import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { DirectoryProvider } from './directory/DirectoryProvider'
import { KabinetSection } from './KabinetSection'
import { LeadershipDirectory } from './LeadershipDirectory'

type OrganizationDirectoryProps = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

export function OrganizationDirectory(props: OrganizationDirectoryProps) {
  return (
    <DirectoryProvider>
      <section className="organization-experience" id="pillars">
        <KabinetSection divisions={props.divisions} />
        <LeadershipDirectory {...props} />
      </section>
    </DirectoryProvider>
  )
}
