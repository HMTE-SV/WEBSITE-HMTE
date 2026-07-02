import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ProgramCatalog } from '@/components/site/ProgramCatalog'
import { PublicPageFrame, PublicSection } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { featuredProgramPresentations } from '@/data/program-presentations'
import { getOrganizationData } from '@/lib/organization-data'
import { getProgramHref } from '@/lib/organization-slugs'
import type { ProgramStatus } from '@/types/content'

export const metadata: Metadata = {
  title: 'Program Kerja HMTE TRE SV UGM',
  description: 'Program unggulan dan katalog program kerja HMTE TRE SV UGM per bidang.',
}

function getStatusClass(status: ProgramStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

export default async function ProgramsPage() {
  const { divisionsByCode, programsByDivision } = await getOrganizationData()
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })
  const allPrograms = divisions.flatMap((division) => programsByDivision[division.code])
  const statusCounts = allPrograms.reduce(
    (counts, program) => ({ ...counts, [program.status]: counts[program.status] + 1 }),
    { Selesai: 0, 'Sedang Berjalan': 0, Terencana: 0 } satisfies Record<ProgramStatus, number>,
  )
  const featuredPrograms = featuredProgramPresentations.flatMap((presentation) => {
    const division = divisionsByCode[presentation.divisionCode]
    const program = programsByDivision[presentation.divisionCode].find(
      (item) => item.name === presentation.programName,
    )

    return division && program ? [{ division, presentation, program }] : []
  })

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <section className="program-index-hero">
        <div className="public-shell program-index-hero-layout">
          <div className="program-index-intro">
            <span className="program-index-kicker">Program Kerja · Kabinet 2026</span>
            <h1>Kerja yang bisa diikuti, bukan sekadar daftar.</h1>
            <p>
              Telusuri program unggulan setiap bidang, lihat statusnya, lalu ikuti detail agenda, timeline,
              dan dokumen pendukung dalam satu alur yang jelas.
            </p>
          </div>
          <div className="program-index-stats" aria-label="Ringkasan program kerja">
            <div>
              <strong>{allPrograms.length}</strong>
              <span>Total program</span>
            </div>
            <div>
              <strong>{featuredPrograms.length}</strong>
              <span>Program unggulan</span>
            </div>
            <div>
              <strong>{statusCounts['Sedang Berjalan']}</strong>
              <span>Sedang berjalan</span>
            </div>
            <div>
              <strong>{statusCounts.Selesai}</strong>
              <span>Selesai</span>
            </div>
          </div>
        </div>
      </section>

      <PublicSection>
        <div className="program-featured-heading">
          <div>
            <span className="public-label">Pilihan setiap bidang</span>
            <h2>Program unggulan</h2>
          </div>
          <p>Satu program utama dari PH dan setiap bidang, lengkap dengan halaman kerja yang lebih mendalam.</p>
        </div>

        <div className="program-featured-grid">
          {featuredPrograms.map(({ division, presentation, program }, index) => (
            <Link
              className={index === 0 ? 'program-featured-card is-lead' : 'program-featured-card'}
              href={getProgramHref(program)}
              key={division.code}
            >
              <div className="program-featured-media">
                <Image
                  src={presentation.image}
                  alt={`Dokumentasi ${program.name}`}
                  fill
                  sizes={index === 0 ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 760px) 100vw, 25vw'}
                />
                <span className="program-featured-badge">Unggulan</span>
                <span className={`program-featured-status ${getStatusClass(program.status)}`}>{program.status}</span>
              </div>
              <div className="program-featured-copy">
                <span>{division.shortName}</span>
                <h3>{program.name}</h3>
                <p>{presentation.tagline}</p>
                <div>
                  <time>{program.date}</time>
                  <strong>Buka halaman</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection>
        <ProgramCatalog divisions={divisions} programsByDivision={programsByDivision} />
      </PublicSection>
    </PublicPageFrame>
  )
}
