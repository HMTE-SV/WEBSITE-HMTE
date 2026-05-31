import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { leadershipDivisionOrder, divisionsByCode } from '@/data/divisions'
import { leadersByDivision } from '@/data/leaders'

export const metadata: Metadata = {
  title: 'Kepengurusan HMTE TRE SV UGM',
  description: 'Direktori kepengurusan HMTE TRE SV UGM.',
}

export default function LeadershipPage() {
  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="Kepengurusan"
        title="Direktori pengurus"
        lead="Ringkasan pengurus per bidang. Data ini disiapkan agar nanti bisa dikelola melalui admin dashboard."
      />
      <PublicSection title="Bidang dan anggota">
        <div className="public-grid two">
          {leadershipDivisionOrder.map((divisionCode) => {
            const division = divisionsByCode[divisionCode]
            const leaders = leadersByDivision[divisionCode]

            return (
              <PublicCard
                eyebrow={`${leaders.length} anggota`}
                title={division.name}
                body={leaders.map((leader) => `${leader.name} (${leader.role})`).join(', ')}
                key={division.code}
              />
            )
          })}
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
