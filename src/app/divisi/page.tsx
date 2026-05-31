import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { getOrganizationData } from '@/lib/organization-data'

export const metadata: Metadata = {
  title: 'Divisi HMTE TRE SV UGM',
  description: 'Bidang dan divisi HMTE TRE SV UGM.',
}

export default async function DivisionsPage() {
  const { divisions } = await getOrganizationData()

  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="Divisi"
        title="Bidang organisasi"
        lead="Delapan bidang kabinet HMTE yang menjadi dasar pengelolaan program kerja, kaderisasi, media, advokasi, relasi, dan kewirausahaan."
      />
      <PublicSection title="Daftar bidang">
        <div className="public-grid">
          {divisions.map((division) => (
            <PublicCard
              eyebrow={String(division.order).padStart(2, '0')}
              title={division.name}
              body={division.description}
              key={division.code}
            />
          ))}
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
