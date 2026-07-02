import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { divisionVisuals } from '@/data/organization-presentation'
import { getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref } from '@/lib/organization-slugs'

export const metadata: Metadata = {
  title: 'Bidang dan Divisi HMTE TRE SV UGM',
  description: 'Jelajahi Pengurus Harian dan tujuh bidang HMTE TRE SV UGM.',
}

export default async function DivisionsPage() {
  const { divisionsByCode, leadersByDivision, programsByDivision } = await getOrganizationData()
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })

  return (
    <PublicPageFrame activeHref="/divisi">
      <PublicPageHeader
        kicker="Bidang & Divisi"
        title="Delapan ruang, satu gerak"
        lead="Kenali karakter, pengurus, dan program kerja setiap bidang. Halaman ini menjadi pintu masuk menuju cerita lengkap masing-masing divisi."
      />
      <PublicSection>
        <div className="division-catalog">
          {divisions.map((division, index) => {
            const leaderCount = leadersByDivision[division.code].length
            const programCount = programsByDivision[division.code].length

            return (
              <Link
                className={index === 0 ? 'division-catalog-card is-featured' : 'division-catalog-card'}
                href={getDivisionHref(division.code)}
                key={division.code}
              >
                <div className="division-catalog-media">
                  <Image
                    src={divisionVisuals[division.code]}
                    alt={`Dokumentasi kegiatan ${division.name}`}
                    fill
                    sizes={index === 0 ? '(max-width: 800px) 100vw, 66vw' : '(max-width: 800px) 100vw, 33vw'}
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="division-catalog-copy">
                  <div>
                    <span className="public-label">{division.shortName}</span>
                    <h2>{division.name}</h2>
                  </div>
                  <p>{division.description}</p>
                  <div className="division-catalog-meta">
                    <span>{leaderCount} pengurus</span>
                    <span>{programCount} program kerja</span>
                    <strong>Buka divisi</strong>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
