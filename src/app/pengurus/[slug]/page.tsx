import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame, PublicSection } from '@/components/site/PublicPage'
import { divisionVisuals } from '@/data/organization-presentation'
import { getLocalOrganizationData, getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref, getLeaderHref, toOrganizationSlug } from '@/lib/organization-slugs'
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
    const leader = leadersByDivision[division.code].find((item) => toOrganizationSlug(item.name) === slug)

    if (leader) {
      return { leader, division, divisionCode: division.code }
    }
  }
}

export function generateStaticParams() {
  const { divisions, leadersByDivision } = getLocalOrganizationData()

  return divisions.flatMap((division) =>
    leadersByDivision[division.code].map((leader) => ({ slug: toOrganizationSlug(leader.name) })),
  )
}

export async function generateMetadata({ params }: LeaderProfilePageProps): Promise<Metadata> {
  const [{ slug }, { divisions, leadersByDivision }] = await Promise.all([params, getOrganizationData()])
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
  const teammates = organization.leadersByDivision[divisionCode].filter((item) => item.name !== leader.name).slice(0, 3)
  const programs = organization.programsByDivision[divisionCode]

  return (
    <PublicPageFrame activeHref="/kepengurusan">
      <section className="leader-profile-hero">
        <Image
          src={divisionVisuals[divisionCode]}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className="leader-profile-overlay" />
        <div className="public-shell leader-profile-hero-content">
          <Link href={`/kepengurusan?divisi=${divisionCode}`} className="division-profile-back">
            Direktori Pengurus
          </Link>
          <div className="leader-profile-layout">
            <div className="leader-profile-photo">
              {leader.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="organization-person-photo" src={leader.photo} alt={leader.name} />
              ) : (
                <Image className="organization-logo-fallback" src="/assets/logo-hmte.svg" alt="Logo HMTE" width={260} height={116} />
              )}
            </div>
            <div className="leader-profile-copy">
              <span>{division.shortName}</span>
              <h1>{leader.name}</h1>
              <p>{leader.role}</p>
              <Link href={getDivisionHref(divisionCode)}>{division.name}</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicSection>
        <div className="leader-profile-details">
          <div>
            <span className="public-label">Profil organisasi</span>
            <h2>Peran di HMTE</h2>
            <p>{leader.bio || `${leader.name} menjalankan peran sebagai ${leader.role} di ${division.name} dan berkolaborasi dalam pelaksanaan agenda bidang selama satu periode kepengurusan.`}</p>
          </div>
          <dl>
            <div>
              <dt>Bidang</dt>
              <dd>{division.shortName}</dd>
            </div>
            <div>
              <dt>Jabatan</dt>
              <dd>{leader.role}</dd>
            </div>
            {leader.batch ? (
              <div>
                <dt>Angkatan</dt>
                <dd>{leader.batch}</dd>
              </div>
            ) : null}
            {leader.origin ? (
              <div>
                <dt>Asal</dt>
                <dd>{leader.origin}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </PublicSection>

      <PublicSection title={`Program yang dijalankan ${division.shortName}`}>
        <div className="leader-program-strip">
          {programs.map((program) => (
            <article key={program.name}>
              <span>{program.status}</span>
              <h3>{program.name}</h3>
              <p>{program.desc}</p>
              <time>{program.date}</time>
            </article>
          ))}
        </div>
      </PublicSection>

      {teammates.length > 0 ? (
        <PublicSection title={`Rekan di ${division.shortName}`}>
          <div className="leader-teammates">
            {teammates.map((teammate) => (
              <Link href={getLeaderHref(teammate)} key={teammate.name}>
                <span>{teammate.role}</span>
                <strong>{teammate.name}</strong>
              </Link>
            ))}
          </div>
        </PublicSection>
      ) : null}
    </PublicPageFrame>
  )
}
