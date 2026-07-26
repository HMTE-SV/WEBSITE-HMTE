import type { Metadata } from 'next'
import Image from 'next/image'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { LeadershipIndex } from '@/components/site/LeadershipIndex'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { getOrganizationData } from '@/lib/organization-data'
import type { DivisionCode } from '@/types/content'

export const metadata: Metadata = {
  title: 'Struktur Pengurus HMTE TRE SV UGM',
  description: 'Direktori anggota Kabinet Abya Vistara HMTE TRE SV UGM periode 2026/2027.',
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
  const totalLeaders = divisions.reduce(
    (total, division) => total + leadersByDivision[division.code].length,
    0,
  )
  const normalizedDivision = divisi?.toUpperCase()
  const initialDivision = leadershipDivisionOrder.includes(normalizedDivision as DivisionCode)
    ? (normalizedDivision as DivisionCode)
    : 'PH'

  return (
    <PublicPageFrame activeHref="/kepengurusan">
      <section className="leadership-page" aria-labelledby="leadership-title">
        <div className="org-shell leadership-page-shell">
          <header className="leadership-page-head has-hero-backdrop">
            <HeroBackdrop variant="drift" mesh={false} />
            <div className="leadership-page-copy">
              <p className="org-context">Direktori anggota · Abya Vistara</p>
              <h1 id="leadership-title">
                Satu kabinet,
                <span>{totalLeaders} orang di dalamnya.</span>
              </h1>
              <p>
                Pilih satu bidang untuk menemukan nama dan jabatan. Direktori dipadatkan per bidang
                agar tetap terbaca dalam satu layar.
              </p>
            </div>
            <div className="leadership-page-mark">
              <Image
                src="/assets/abya-vistara/logo-kabinet.webp"
                alt="Logo Kabinet Abya Vistara"
                width={176}
                height={176}
                priority
              />
              <span>
                <strong>{String(totalLeaders).padStart(2, '0')}</strong>
                anggota terdata
              </span>
            </div>
          </header>

          <LeadershipIndex
            divisions={divisions}
            leadersByDivision={leadersByDivision}
            initialDivision={initialDivision}
          />
        </div>
      </section>
    </PublicPageFrame>
  )
}
