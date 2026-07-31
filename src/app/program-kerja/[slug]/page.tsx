import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProgramDetailWorkspace } from '@/components/site/ProgramDetailWorkspace'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { programsByDivision } from '@/data/programs'
import { getOrganizationData } from '@/lib/organization-data'
import { toOrganizationSlug } from '@/lib/organization-slugs'
import { getSiteSettings } from '@/lib/site-settings-data'
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

/*
 * Jaring pengaman, sama alasannya dengan halaman daftarnya. Lihat komentar
 * `revalidate` di src/app/page.tsx.
 */
export const revalidate = 300

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

  return {
    title: `${match.program.name} — Program Kerja HMTE`,
    // Ringkasan panjang dulu dipakai lebih dulu, padahal isinya bisa beberapa
    // paragraf. Deskripsi meta yang terpotong di tengah kalimat lebih buruk
    // daripada satu kalimat utuh yang memang ditulis sebagai ringkasan singkat.
    description: match.program.desc,
  }
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const [{ slug }, organization, settings] = await Promise.all([
    params,
    getOrganizationData(),
    getSiteSettings(),
  ])
  const match = findProgram(slug, organization.divisions, organization.programsByDivision)

  if (!match) notFound()

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <ProgramDetailWorkspace
        division={match.division}
        leaders={organization.leadersByDivision[match.divisionCode]}
        program={match.program}
        relatedPrograms={organization.programsByDivision[match.divisionCode].filter(
          (item) => item.name !== match.program.name,
        )}
        year={settings.agendaYear}
      />
    </PublicPageFrame>
  )
}
