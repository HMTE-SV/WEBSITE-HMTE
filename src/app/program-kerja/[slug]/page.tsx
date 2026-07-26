import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProgramDetailWorkspace } from '@/components/site/ProgramDetailWorkspace'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { featuredProgramPresentations } from '@/data/program-presentations'
import { programsByDivision } from '@/data/programs'
import { getOrganizationData } from '@/lib/organization-data'
import { toOrganizationSlug } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Program } from '@/types/content'

type ProgramDetailPageProps = {
  params: Promise<{ slug: string }>
}

type ProgramMatch = {
  division: Division
  divisionCode: DivisionCode
  program: Program
}

function findProgram(
  slug: string,
  divisions: Division[],
  programs: Record<DivisionCode, Program[]>,
): ProgramMatch | undefined {
  for (const division of divisions) {
    const program = programs[division.code].find(
      (item) => toOrganizationSlug(item.name) === slug,
    )

    if (program) {
      return { division, divisionCode: division.code, program }
    }
  }
}

export function generateStaticParams() {
  return Object.values(programsByDivision)
    .flat()
    .map((program) => ({ slug: toOrganizationSlug(program.name) }))
}

export async function generateMetadata({ params }: ProgramDetailPageProps): Promise<Metadata> {
  const [{ slug }, organization] = await Promise.all([params, getOrganizationData()])
  const match = findProgram(slug, organization.divisions, organization.programsByDivision)

  if (!match) {
    return { title: 'Program kerja tidak ditemukan' }
  }

  const presentation = featuredProgramPresentations.find(
    (item) => item.divisionCode === match.divisionCode && item.programName === match.program.name,
  )

  return {
    title: `${match.program.name} — Program Kerja HMTE`,
    description: presentation?.summary ?? match.program.desc,
  }
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const [{ slug }, organization] = await Promise.all([params, getOrganizationData()])
  const match = findProgram(slug, organization.divisions, organization.programsByDivision)

  if (!match) notFound()

  const presentation = featuredProgramPresentations.find(
    (item) => item.divisionCode === match.divisionCode && item.programName === match.program.name,
  )

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <ProgramDetailWorkspace
        division={match.division}
        leaders={organization.leadersByDivision[match.divisionCode]}
        presentation={presentation}
        program={match.program}
        relatedPrograms={organization.programsByDivision[match.divisionCode].filter(
          (item) => item.name !== match.program.name,
        )}
      />
    </PublicPageFrame>
  )
}
