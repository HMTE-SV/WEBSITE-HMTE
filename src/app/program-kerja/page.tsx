import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { ProgramCatalog } from '@/components/site/ProgramCatalog'
import { PublicPageFrame } from '@/components/site/PublicPage'
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
    { Terjadwal: 0, Berkala: 0 } satisfies Record<ProgramStatus, number>,
  )
  const departmentProgramCount = allPrograms.length - programsByDivision.PH.length
  const featuredPrograms = featuredProgramPresentations.flatMap((presentation) => {
    const division = divisionsByCode[presentation.divisionCode]
    const program = programsByDivision[presentation.divisionCode].find(
      (item) => item.name === presentation.programName,
    )

    return division && program ? [{ division, presentation, program }] : []
  })

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <section
        className="program-index-hero has-hero-backdrop"
        aria-labelledby="programs-title"
      >
        <HeroBackdrop variant="dome" />
        <div className="org-shell program-index-hero-shell">
          <div className="program-index-hero-grid">
            <div>
              <p className="org-context">Program kerja · Abya Vistara 2026/2027</p>
              <h1 id="programs-title">
                Agenda yang mudah dicari,
                <span>detail yang mudah dibuka.</span>
              </h1>
              <p>
                Telusuri program per bidang, pola jadwal, dan halaman detail untuk setiap agenda.
                Label menunjukkan pola pelaksanaan, bukan status realisasi.
              </p>
            </div>
            <div className="program-index-hero-mark" aria-hidden="true">
              <Image
                src="/assets/abya-vistara/logo-kabinet.webp"
                alt=""
                width={180}
                height={180}
              />
              <strong>{String(allPrograms.length).padStart(2, '0')}</strong>
              <span>program tercatat</span>
            </div>
          </div>

          <dl className="org-meter" aria-label="Ringkasan program kerja">
            <div>
              <dt>Program unggulan</dt>
              <dd>{featuredPrograms.length}</dd>
            </div>
            <div>
              <dt>Program departemen</dt>
              <dd>{departmentProgramCount}</dd>
            </div>
            <div>
              <dt>Terjadwal</dt>
              <dd>{statusCounts.Terjadwal}</dd>
            </div>
            <div>
              <dt>Berkala</dt>
              <dd>{statusCounts.Berkala}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="tix-section" aria-labelledby="featured-title">
        <div className="org-shell">
          <div className="tix-heading">
            <div>
              <p className="org-context">Pilihan buku panduan</p>
              <h2 id="featured-title">Tiga program unggulan.</h2>
            </div>
            <p>TORSI, HMTE Mengajar, dan Elektro Cup mendapat penjelasan khusus di buku panduan.</p>
          </div>
          <div className="tix-grid">
            {featuredPrograms.map(({ division, presentation, program }) => (
              <Link className="tix" href={getProgramHref(program)} key={division.code}>
                <div className="tix-media">
                  <Image
                    src={presentation.image}
                    alt={`Dokumentasi HMTE untuk ${program.name}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                  <span className="tix-code">{division.shortName}</span>
                </div>
                <div className="tix-body">
                  <h3>{program.name}</h3>
                  <p>{presentation.tagline}</p>
                  <div className="tix-foot">
                    <span className={`org-status ${getStatusClass(program.status)}`}>
                      <i aria-hidden="true" />
                      {program.status}
                    </span>
                    <time>{program.date}</time>
                    <b aria-hidden="true">↗</b>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ledger" aria-labelledby="catalog-title">
        <div className="org-shell">
          <ProgramCatalog divisions={divisions} programsByDivision={programsByDivision} />
        </div>
      </section>
    </PublicPageFrame>
  )
}
