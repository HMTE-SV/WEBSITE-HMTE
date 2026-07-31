import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getDivisionMediaSlotKey } from '@/data/media-slots'
import { leadershipDivisionOrder } from '@/data/divisions'
import { divisionVisuals } from '@/data/organization-presentation'
import { getOrganizationData } from '@/lib/organization-data'
import { getPublicMediaSlots } from '@/lib/media-slot-data'
import {
  getDivisionHref,
  getLeaderHref,
  getProgramHref,
  toOrganizationSlug,
} from '@/lib/organization-slugs'
import type { ProgramStatus } from '@/types/content'

type DivisionDetailPageProps = {
  params: Promise<{ slug: string }>
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

/*
 * Jaring pengaman, sama alasannya dengan halaman daftarnya. Lihat komentar
 * `revalidate` di src/app/page.tsx.
 */
export const revalidate = 300

export function generateStaticParams() {
  return leadershipDivisionOrder.map((code) => ({ slug: toOrganizationSlug(code) }))
}

export async function generateMetadata({ params }: DivisionDetailPageProps): Promise<Metadata> {
  const [{ slug }, { divisions }] = await Promise.all([params, getOrganizationData()])
  const division = divisions.find((item) => toOrganizationSlug(item.code) === slug)

  if (!division) {
    return { title: 'Divisi tidak ditemukan' }
  }

  return {
    title: `${division.name} — HMTE TRE SV UGM`,
    description: `${division.description} Lihat anggota dan program kerja ${division.shortName}.`,
  }
}

export default async function DivisionDetailPage({ params }: DivisionDetailPageProps) {
  const [{ slug }, organization, mediaSlots] = await Promise.all([
    params,
    getOrganizationData(),
    getPublicMediaSlots(),
  ])
  const division = organization.divisions.find((item) => toOrganizationSlug(item.code) === slug)

  if (!division) {
    notFound()
  }

  const leaders = organization.leadersByDivision[division.code]
  const programs = organization.programsByDivision[division.code]
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const item = organization.divisionsByCode[code]
    return item ? [item] : []
  })
  const divisionIndex = divisions.findIndex((item) => item.code === division.code)
  const divisionNumber = String(divisionIndex + 1).padStart(2, '0')
  const statusCounts = programs.reduce(
    (counts, program) => ({ ...counts, [program.status]: counts[program.status] + 1 }),
    { Terjadwal: 0, Berkala: 0 } satisfies Record<ProgramStatus, number>,
  )
  const divisionHero = mediaSlots[getDivisionMediaSlotKey(division.code)]

  return (
    <PublicPageFrame activeHref="/divisi">
      <section className="division-detail-hero" aria-labelledby="division-title">
        <Image
          className="division-detail-hero-image"
          src={divisionHero.url || divisionVisuals[division.code]}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: `${divisionHero.focalPointX}% ${divisionHero.focalPointY}%` }}
        />
        <div className="division-detail-hero-tone" aria-hidden="true" />
        <span className="division-detail-index" aria-hidden="true">{divisionNumber}</span>
        <div className="org-shell division-detail-hero-content">
          <Link href="/divisi" className="division-detail-back">
            ← Semua bidang
          </Link>
          <div className="division-detail-heading">
            <div>
              <span>
                <i aria-hidden="true">{divisionNumber}</i>
                {division.shortName}
              </span>
              <h1 id="division-title">{division.name}</h1>
              <p>{division.description}</p>
            </div>
            <dl aria-label="Ringkasan bidang">
              <div>
                <dt>Anggota</dt>
                <dd>{leaders.length}</dd>
              </div>
              <div>
                <dt>Program</dt>
                <dd>{programs.length}</dd>
              </div>
              <div>
                <dt>Berkala</dt>
                <dd>{statusCounts.Berkala}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="division-detail-workspace">
        <div className="org-shell">
          <nav className="division-detail-switcher" aria-label="Pindah bidang">
            {divisions.map((item, index) => (
              <Link
                href={getDivisionHref(item.code)}
                className={item.code === division.code ? 'is-active' : undefined}
                aria-current={item.code === division.code ? 'page' : undefined}
                key={item.code}
              >
                <i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i>
                {item.shortName}
              </Link>
            ))}
          </nav>

          <div className="division-detail-columns">
            <section className="division-detail-panel" aria-labelledby="division-members-title">
              <header>
                <div>
                  <span>Orang di dalamnya</span>
                  <h2 id="division-members-title">Anggota {division.shortName}</h2>
                </div>
                <Link href={`/kepengurusan?divisi=${division.code}`}>Buka direktori</Link>
              </header>
              <div className="division-detail-member-list">
                {leaders.map((leader) => (
                  <Link href={getLeaderHref(leader)} key={leader.name}>
                    <span aria-hidden="true">{getInitials(leader.name)}</span>
                    <div>
                      <strong>{leader.name}</strong>
                      <small>{leader.role}</small>
                    </div>
                    <time>{leader.batch ?? '—'}</time>
                    <b aria-hidden="true">↗</b>
                  </Link>
                ))}
              </div>
            </section>

            <section className="division-detail-panel" aria-labelledby="division-programs-title">
              <header>
                <div>
                  <span>Agenda bidang</span>
                  <h2 id="division-programs-title">Program kerja</h2>
                </div>
                <Link href={`/program-kerja#division-${division.code.toLowerCase()}`}>
                  Semua program
                </Link>
              </header>
              <div className="division-detail-program-list">
                {programs.map((program, index) => (
                  <Link href={getProgramHref(program)} key={program.name}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{program.name}</strong>
                      <small>{program.desc}</small>
                    </div>
                    <aside>
                      <em>{program.status}</em>
                      <time>{program.date}</time>
                    </aside>
                    <b aria-hidden="true">↗</b>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
