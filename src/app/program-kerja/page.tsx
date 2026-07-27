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
import { buildProgramSchedule, formatScheduleShort } from '@/lib/program-schedule'
import { getSiteSettings } from '@/lib/site-settings-data'
import type { ProgramStatus } from '@/types/content'

export const metadata: Metadata = {
  title: 'Program Kerja HMTE TRE SV UGM',
  description: 'Program unggulan dan katalog program kerja HMTE TRE SV UGM per bidang.',
}

export default async function ProgramsPage() {
  const { divisionsByCode, programsByDivision } = await getOrganizationData()
  const { agendaYear: year } = await getSiteSettings()
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })
  const allPrograms = divisions.flatMap((division) => programsByDivision[division.code])
  const statusCounts = allPrograms.reduce(
    (counts, program) => ({ ...counts, [program.status]: counts[program.status] + 1 }),
    { Terjadwal: 0, Berkala: 0 } satisfies Record<ProgramStatus, number>,
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
      <section className="soft-surface" aria-labelledby="programs-title">
        <div className="soft-shell">
          {/*
            Bento: satu panel naratif besar berdampingan dengan tiga tegel
            ringkasan. Ukurannya berbeda karena perannya memang berbeda, bukan
            untuk variasi visual.
          */}
          <div className="pk-bento">
            <header className="pk-bento-lead has-hero-backdrop">
              <HeroBackdrop variant="dome" />
              <div className="pk-bento-lead-copy">
                <p>Program kerja · Abya Vistara 2026/2027</p>
                <h1 id="programs-title">
                  Agenda yang mudah dicari, <span>detail yang mudah dibuka.</span>
                </h1>
                <p className="pk-bento-lead-note">
                  Telusuri program per bidang dan pola jadwalnya. Label menunjukkan pola
                  pelaksanaan, bukan status realisasi.
                </p>
              </div>
            </header>

            <div className="pk-tile sfc">
              <b>{allPrograms.length}</b>
              <span>program tercatat</span>
            </div>
            <div className="pk-tile sfc">
              <b>{statusCounts.Terjadwal}</b>
              <span>terjadwal</span>
            </div>
            <div className="pk-tile sfc">
              <b>{statusCounts.Berkala}</b>
              <span>berkala</span>
            </div>
          </div>

          <section className="pk-featured" aria-labelledby="featured-title">
            <div className="soft-head">
              <div>
                <h2 id="featured-title">Tiga program unggulan.</h2>
                <p className="pk-subhead">
                  TORSI, HMTE Mengajar, dan Elektro Cup mendapat penjelasan khusus di buku
                  panduan.
                </p>
              </div>
            </div>

            <div className="pk-featured-grid">
              {featuredPrograms.map(({ division, presentation, program }) => {
                const schedule = buildProgramSchedule(program, year)

                return (
                  <Link
                    className="pk-hero-card"
                    href={getProgramHref(program)}
                    key={division.code}
                    data-div={division.code}
                  >
                    <span className="pk-hero-media">
                      <Image
                        src={presentation.image}
                        alt={`Dokumentasi HMTE untuk ${program.name}`}
                        fill
                        sizes="(max-width: 760px) 100vw, 33vw"
                      />
                    </span>
                    <span className="pk-hero-body">
                      <span className="soft-tag">{division.shortName}</span>
                      <h3>{program.name}</h3>
                      <p>{presentation.tagline}</p>
                      <span className="pk-hero-foot">
                        <time>{formatScheduleShort(schedule)}</time>
                        <b aria-hidden="true">→</b>
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="pk-catalog" aria-labelledby="catalog-title">
            <ProgramCatalog divisions={divisions} programsByDivision={programsByDivision} year={year} />
          </section>
        </div>
      </section>
    </PublicPageFrame>
  )
}
