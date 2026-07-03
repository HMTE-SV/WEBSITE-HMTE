import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProgramDetailWorkspace } from '@/components/site/ProgramDetailWorkspace'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { featuredProgramPresentations } from '@/data/program-presentations'
import { getOrganizationData } from '@/lib/organization-data'
import { toOrganizationSlug } from '@/lib/organization-slugs'

type ProgramDetailPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return featuredProgramPresentations.map((presentation) => ({
    slug: toOrganizationSlug(presentation.programName),
  }))
}

export async function generateMetadata({ params }: ProgramDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const presentation = featuredProgramPresentations.find(
    (item) => toOrganizationSlug(item.programName) === slug,
  )

  if (!presentation) {
    return { title: 'Program kerja tidak ditemukan' }
  }

  return {
    title: `${presentation.programName} — Program Kerja HMTE`,
    description: presentation.summary,
  }
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const [{ slug }, organization] = await Promise.all([params, getOrganizationData()])
  const presentation = featuredProgramPresentations.find(
    (item) => toOrganizationSlug(item.programName) === slug,
  )

  if (!presentation) notFound()

  const division = organization.divisionsByCode[presentation.divisionCode]
  const program = organization.programsByDivision[presentation.divisionCode].find(
    (item) => item.name === presentation.programName,
  )

  if (!division || !program) notFound()

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <ProgramDetailWorkspace
        division={division}
        leaders={organization.leadersByDivision[presentation.divisionCode]}
        presentation={presentation}
        program={program}
        relatedPrograms={organization.programsByDivision[presentation.divisionCode].filter(
          (item) => item.name !== program.name,
        )}
        slug={slug}
      />
    </PublicPageFrame>
  )
}
