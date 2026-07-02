import type { Metadata } from 'next'
import { LeadershipIndex } from '@/components/site/LeadershipIndex'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { getOrganizationData } from '@/lib/organization-data'
import type { DivisionCode } from '@/types/content'

export const metadata: Metadata = {
  title: 'Pengurus HMTE TRE SV UGM',
  description: 'Direktori pengurus HMTE TRE SV UGM lintas bidang dan jabatan.',
}

type LeadershipPageProps = {
  searchParams: Promise<{ divisi?: string }>
}

export default async function LeadershipPage({ searchParams }: LeadershipPageProps) {
  const [{ divisi }, { divisionsByCode, leadersByDivision }] = await Promise.all([
    searchParams,
    getOrganizationData(),
  ])
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })
  const normalizedDivision = divisi?.toUpperCase()
  const initialDivision = leadershipDivisionOrder.includes(normalizedDivision as DivisionCode)
    ? (normalizedDivision as DivisionCode)
    : 'ALL'

  return (
    <PublicPageFrame activeHref="/kepengurusan">
      <PublicPageHeader
        kicker="Pengurus"
        title="Orang-orang di balik HMTE"
        lead="Temukan pengurus berdasarkan bidang, jabatan, atau nama. Setiap profil tetap terhubung dengan divisi dan program kerja yang dijalankan."
      />
      <PublicSection>
        <LeadershipIndex
          divisions={divisions}
          leadersByDivision={leadersByDivision}
          initialDivision={initialDivision}
        />
      </PublicSection>
    </PublicPageFrame>
  )
}
