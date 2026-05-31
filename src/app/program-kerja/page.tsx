import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { divisions } from '@/data/divisions'
import { programsByDivision } from '@/data/programs'

export const metadata: Metadata = {
  title: 'Program Kerja HMTE TRE SV UGM',
  description: 'Program kerja HMTE TRE SV UGM per bidang.',
}

export default function ProgramsPage() {
  return (
    <PublicPageFrame activeHref="/program-kerja">
      <PublicPageHeader
        kicker="Program Kerja"
        title="Agenda kerja kabinet"
        lead="Daftar program kerja per bidang sebagai data awal sebelum konten dihubungkan ke Firestore dan admin CRUD."
      />
      {divisions.map((division) => (
        <PublicSection title={division.name} key={division.code}>
          <div className="public-grid">
            {programsByDivision[division.code].map((program) => (
              <PublicCard
                eyebrow={program.status}
                title={program.name}
                body={program.desc}
                meta={program.date}
                key={`${division.code}-${program.name}`}
              />
            ))}
          </div>
        </PublicSection>
      ))}
    </PublicPageFrame>
  )
}
