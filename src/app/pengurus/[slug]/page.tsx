import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getLocalOrganizationData, getOrganizationData } from '@/lib/organization-data'
import {
  getDivisionHref,
  getLeaderHref,
  getProgramHref,
  toOrganizationSlug,
} from '@/lib/organization-slugs'
import type { Division, DivisionCode, Leader } from '@/types/content'

type LeaderProfilePageProps = {
  params: Promise<{ slug: string }>
}

type LeaderWithDivision = {
  leader: Leader
  division: Division
  divisionCode: DivisionCode
}

function findLeader(
  slug: string,
  divisions: Division[],
  leadersByDivision: Record<DivisionCode, Leader[]>,
): LeaderWithDivision | undefined {
  for (const division of divisions) {
    const leader = leadersByDivision[division.code].find(
      (item) => toOrganizationSlug(item.name) === slug,
    )

    if (leader) {
      return { leader, division, divisionCode: division.code }
    }
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

export function generateStaticParams() {
  const { divisions, leadersByDivision } = getLocalOrganizationData()

  return divisions.flatMap((division) =>
    leadersByDivision[division.code].map((leader) => ({ slug: toOrganizationSlug(leader.name) })),
  )
}

export async function generateMetadata({ params }: LeaderProfilePageProps): Promise<Metadata> {
  const [{ slug }, { divisions, leadersByDivision }] = await Promise.all([
    params,
    getOrganizationData(),
  ])
  const result = findLeader(slug, divisions, leadersByDivision)

  if (!result) {
    return { title: 'Pengurus tidak ditemukan' }
  }

  return {
    title: `${result.leader.name} — Pengurus HMTE`,
    description: `${result.leader.name}, ${result.leader.role} di ${result.division.name}.`,
  }
}

export default async function LeaderProfilePage({ params }: LeaderProfilePageProps) {
  const [{ slug }, organization] = await Promise.all([params, getOrganizationData()])
  const result = findLeader(slug, organization.divisions, organization.leadersByDivision)

  if (!result) {
    notFound()
  }

  const { leader, division, divisionCode } = result
  const divisionPeers = organization.leadersByDivision[divisionCode].filter(
    (item) => item.name !== leader.name,
  )
  const teammates = divisionPeers.slice(0, 4)
  const programs = organization.programsByDivision[divisionCode]

  return (
    <PublicPageFrame activeHref="/kepengurusan">
      <section className="member-profile" aria-labelledby="member-name">
        <div className="org-shell member-profile-shell">
          <nav className="member-profile-nav" aria-label="Navigasi profil">
            <Link href={`/kepengurusan?divisi=${divisionCode}`}>← Direktori {division.shortName}</Link>
            <Link href={getDivisionHref(divisionCode)}>Profil bidang ↗</Link>
          </nav>

          <div className="member-profile-grid">
            <figure className="member-profile-portrait">
              {leader.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={leader.photo} alt={leader.name} />
              ) : (
                <>
                  <Image
                    src="/assets/abya-vistara/logo-kabinet.webp"
                    alt=""
                    width={280}
                    height={280}
                    priority
                  />
                  <span aria-hidden="true">{getInitials(leader.name)}</span>
                </>
              )}
              <figcaption>
                <span>Angkatan</span>
                <strong>{leader.batch ?? '—'}</strong>
              </figcaption>
            </figure>

            <article className="member-profile-copy">
              <p>{division.shortName} · Kabinet Abya Vistara</p>
              <h1 id="member-name">{leader.name}</h1>
              <strong>{leader.role}</strong>
              <p>
                {leader.bio ||
                  `${leader.name} menjadi bagian dari ${division.name} dan ikut menjalankan agenda bidang selama periode 2026/2027.`}
              </p>
              <dl>
                <div>
                  <dt>Bidang</dt>
                  <dd>{division.name}</dd>
                </div>
                <div>
                  <dt>Rekan sebidang</dt>
                  <dd>{divisionPeers.length} pengurus</dd>
                </div>
                <div>
                  <dt>Program bidang</dt>
                  <dd>{programs.length} program</dd>
                </div>
              </dl>
            </article>

            <aside className="member-profile-context">
              <section>
                <header>
                  <span>Agenda bidang</span>
                  <Link href={getDivisionHref(divisionCode)}>Lihat semua</Link>
                </header>
                <div className="member-profile-programs">
                  {programs.slice(0, 4).map((program, index) => (
                    <Link href={getProgramHref(program)} key={program.name}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{program.name}</strong>
                      <small>{program.date}</small>
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <header>
                  <span>Rekan satu bidang</span>
                  <Link href={`/kepengurusan?divisi=${divisionCode}`}>Direktori</Link>
                </header>
                <div className="member-profile-team">
                  {teammates.map((teammate) => (
                    <Link href={getLeaderHref(teammate)} key={teammate.name}>
                      <span aria-hidden="true">{getInitials(teammate.name)}</span>
                      <div>
                        <strong>{teammate.name}</strong>
                        <small>{teammate.role}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
