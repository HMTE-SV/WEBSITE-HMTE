import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame, PublicSection } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { isFeaturedProgram } from '@/data/featured-programs'
import { divisionVisuals } from '@/data/organization-presentation'
import { getOrganizationData } from '@/lib/organization-data'
import { getLeaderHref, getProgramHref, toOrganizationSlug } from '@/lib/organization-slugs'
import type { ProgramStatus } from '@/types/content'

type DivisionDetailPageProps = {
  params: Promise<{ slug: string }>
}

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
    description: `${division.description} Lihat pengurus dan program kerja ${division.shortName}.`,
  }
}

export default async function DivisionDetailPage({ params }: DivisionDetailPageProps) {
  const [{ slug }, { divisions, leadersByDivision, programsByDivision }] = await Promise.all([
    params,
    getOrganizationData(),
  ])
  const division = divisions.find((item) => toOrganizationSlug(item.code) === slug)

  if (!division) {
    notFound()
  }

  const leaders = leadersByDivision[division.code]
  const programs = programsByDivision[division.code]
  const statusCounts = programs.reduce(
    (counts, program) => ({ ...counts, [program.status]: counts[program.status] + 1 }),
    { Selesai: 0, 'Sedang Berjalan': 0, Terencana: 0 } satisfies Record<ProgramStatus, number>,
  )

  return (
    <PublicPageFrame activeHref="/divisi">
      <section className="division-profile-hero">
        <Image
          src={divisionVisuals[division.code]}
          alt={`Dokumentasi kegiatan ${division.name}`}
          fill
          priority
          sizes="100vw"
        />
        <div className="division-profile-overlay" />
        <div className="public-shell division-profile-hero-content">
          <Link href="/divisi" className="division-profile-back">
            Bidang & Divisi
          </Link>
          <div className="division-profile-heading">
            <div>
              <span>{division.shortName}</span>
              <h1>{division.name}</h1>
              <p>{division.description}</p>
            </div>
            <div className="division-profile-numbers" aria-label="Ringkasan divisi">
              <div>
                <strong>{leaders.length}</strong>
                <span>Pengurus</span>
              </div>
              <div>
                <strong>{programs.length}</strong>
                <span>Program</span>
              </div>
              <div>
                <strong>{statusCounts['Sedang Berjalan']}</strong>
                <span>Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="division-profile-local-nav" aria-label={`Navigasi ${division.shortName}`}>
        <div className="public-shell">
          <a href="#profil">Profil</a>
          <a href="#pengurus">Pengurus</a>
          <a href="#program-kerja">Program Kerja</a>
        </div>
      </nav>

      <PublicSection>
        <div className="division-profile-intro" id="profil">
          <div>
            <span className="public-label">Profil bidang</span>
            <h2>Ruang kerja {division.shortName}</h2>
          </div>
          <p>
            {division.description} Seluruh pengurus dan program di halaman ini berasal dari sumber data organisasi
            yang sama, sehingga informasi tetap konsisten di landing page maupun direktori utama.
          </p>
        </div>
      </PublicSection>

      <PublicSection title={`Pengurus ${division.shortName}`}>
        <div className="division-member-grid" id="pengurus">
          {leaders.map((leader) => (
            <Link className="division-member-card" href={getLeaderHref(leader)} key={leader.name}>
              <div className="division-member-photo">
                {leader.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="organization-person-photo" src={leader.photo} alt={leader.name} />
                ) : (
                  <Image className="organization-logo-fallback" src="/assets/logo-hmte.svg" alt="" width={140} height={62} />
                )}
              </div>
              <div>
                <span>{leader.role}</span>
                <h3>{leader.name}</h3>
                <strong>Lihat profil</strong>
              </div>
            </Link>
          ))}
        </div>
        <div className="organization-section-link">
          <Link href={`/kepengurusan?divisi=${division.code}`}>Buka direktori seluruh pengurus</Link>
        </div>
      </PublicSection>

      <PublicSection title={`Program kerja ${division.shortName}`}>
        <div className="division-program-list" id="program-kerja">
          {programs.map((program, index) => {
            const featured = isFeaturedProgram(division.code, program.name)

            return (
            <article className={featured ? 'division-program-item is-featured' : 'division-program-item'} key={program.name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <div className="division-program-heading">
                  <div>
                    {featured ? <span className="division-program-featured">Unggulan</span> : null}
                    <h3>{program.name}</h3>
                  </div>
                  <em className={`status-${program.status.toLowerCase().replace(/\s+/g, '-')}`}>{program.status}</em>
                </div>
                <p>{program.desc}</p>
                {featured ? <Link className="division-program-detail-link" href={getProgramHref(program)}>Buka halaman program</Link> : null}
              </div>
              <time>{program.date}</time>
            </article>
            )
          })}
        </div>
        <div className="organization-section-link">
          <Link href={`/program-kerja#division-${division.code.toLowerCase()}`}>
            Buka katalog seluruh program kerja
          </Link>
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
