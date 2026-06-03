import type { Metadata } from 'next'
import Image from 'next/image'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { getOrganizationData } from '@/lib/organization-data'
import type { ProgramStatus } from '@/types/content'

export const metadata: Metadata = {
  title: 'Program Kerja HMTE TRE SV UGM',
  description: 'Program kerja HMTE TRE SV UGM per bidang.',
}

function getProgramStatusClass(status: ProgramStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

export default async function ProgramsPage() {
  const { divisions, programsByDivision } = await getOrganizationData()
  const allPrograms = divisions.flatMap((division) =>
    programsByDivision[division.code].map((program) => ({
      ...program,
      divisionCode: division.code,
      divisionName: division.shortName,
    })),
  )
  const statusCounts = allPrograms.reduce(
    (counts, program) => ({
      ...counts,
      [program.status]: counts[program.status] + 1,
    }),
    { Selesai: 0, 'Sedang Berjalan': 0, Terencana: 0 } satisfies Record<ProgramStatus, number>,
  )
  const featuredProgram = allPrograms.find((program) => program.status === 'Sedang Berjalan') || allPrograms[0]
  const runningPrograms = allPrograms.filter((program) => program.status === 'Sedang Berjalan').slice(0, 5)

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <PublicPageHeader
        kicker="Program Kerja"
        title="Program Kerja"
        lead="Roadmap program HMTE TRE SV UGM 2026, disusun per bidang agar fokus kerja dan status kegiatan mudah dipindai."
      />
      <PublicSection>
        <div className="program-roadmap">
          <section className="program-roadmap-overview" aria-labelledby="program-overview-title">
            <div className="program-roadmap-intro">
              <div>
                <div className="program-roadmap-meta">
                  <span>Roadmap Kabinet</span>
                  <span>TRE SV UGM 2026</span>
                  <span>{divisions.length} bidang</span>
                </div>
                <h2 id="program-overview-title">Fokus kerja yang sedang berjalan dan rencana tiap bidang.</h2>
                <p>
                  Halaman ini dibuat sebagai peta singkat: lihat status keseluruhan, pahami program yang aktif,
                  lalu masuk ke bidang yang relevan.
                </p>
              </div>
              <div className="program-roadmap-stats" aria-label="Ringkasan status program">
                <div>
                  <strong>{allPrograms.length}</strong>
                  <span>Total program</span>
                  <i style={{ width: '100%' }} />
                </div>
                <div>
                  <strong>{statusCounts['Sedang Berjalan']}</strong>
                  <span>Sedang berjalan</span>
                  <i style={{ width: `${(statusCounts['Sedang Berjalan'] / allPrograms.length) * 100}%` }} />
                </div>
                <div>
                  <strong>{statusCounts.Terencana}</strong>
                  <span>Terencana</span>
                  <i style={{ width: `${(statusCounts.Terencana / allPrograms.length) * 100}%` }} />
                </div>
                <div>
                  <strong>{statusCounts.Selesai}</strong>
                  <span>Selesai</span>
                  <i style={{ width: `${(statusCounts.Selesai / allPrograms.length) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="program-roadmap-current" id="sedang-berjalan">
              <div className="program-roadmap-current-head">
                <div>
                  <span className="public-label">Sedang Berjalan</span>
                  <h2>Program aktif</h2>
                </div>
                {featuredProgram ? <span className="public-status">{featuredProgram.divisionName}</span> : null}
              </div>
              {featuredProgram ? (
                <article className="program-roadmap-feature">
                  <Image
                    src="/assets/smart_grid_dashboard.png"
                    alt="Ilustrasi dashboard kegiatan teknologi HMTE"
                    width={360}
                    height={220}
                  />
                  <div>
                    <h3>{featuredProgram.name}</h3>
                    <p>{featuredProgram.desc}</p>
                    <span>{featuredProgram.date}</span>
                  </div>
                </article>
              ) : null}
              <div className="program-roadmap-running-list">
                {runningPrograms.map((program) => (
                  <a href={`#division-${program.divisionCode.toLowerCase()}`} key={`${program.divisionCode}-${program.name}`}>
                    <span>{program.divisionName}</span>
                    <strong>{program.name}</strong>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <nav className="program-roadmap-index" aria-label="Navigasi bidang program">
            {divisions.map((division) => (
              <a href={`#division-${division.code.toLowerCase()}`} key={division.code}>
                <span>{division.shortName}</span>
                <strong>{programsByDivision[division.code].length}</strong>
              </a>
            ))}
          </nav>

          <section className="program-roadmap-grid" id="program-list" aria-label="Program kerja per bidang">
            {divisions.map((division) => {
              const divisionPrograms = programsByDivision[division.code]
              const divisionStatusCounts = divisionPrograms.reduce(
                (counts, program) => ({
                  ...counts,
                  [program.status]: counts[program.status] + 1,
                }),
                { Selesai: 0, 'Sedang Berjalan': 0, Terencana: 0 } satisfies Record<ProgramStatus, number>,
              )

              return (
                <article className="program-roadmap-card" id={`division-${division.code.toLowerCase()}`} key={division.code}>
                  <div className="program-roadmap-card-head">
                    <span>{division.shortName}</span>
                    <strong>{divisionPrograms.length} program</strong>
                  </div>
                  <h2>{division.name}</h2>
                  <p>{division.description}</p>
                  <div className="program-roadmap-card-stats" aria-label={`Status program ${division.shortName}`}>
                    <span>{divisionStatusCounts['Sedang Berjalan']} aktif</span>
                    <span>{divisionStatusCounts.Terencana} rencana</span>
                    <span>{divisionStatusCounts.Selesai} selesai</span>
                  </div>
                  <ol className="program-roadmap-items">
                    {divisionPrograms.map((program) => (
                      <li className={getProgramStatusClass(program.status)} key={`${division.code}-${program.name}`}>
                        <div className="program-roadmap-item-copy">
                          <strong>{program.name}</strong>
                          <span>{program.desc}</span>
                        </div>
                        <div className="program-roadmap-item-meta">
                          <em>{program.date}</em>
                          <span className="public-status">{program.status}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              )
            })}
          </section>
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
