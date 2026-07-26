import Image from 'next/image'
import Link from 'next/link'
import { divisionVisuals } from '@/data/organization-presentation'
import type { FeaturedProgramPresentation } from '@/data/program-presentations'
import { getDivisionHref, getLeaderHref, getProgramHref } from '@/lib/organization-slugs'
import type { Division, Leader, Program } from '@/types/content'

type ProgramDetailWorkspaceProps = {
  division: Division
  leaders: Leader[]
  presentation?: FeaturedProgramPresentation
  program: Program
  relatedPrograms: Program[]
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

export function ProgramDetailWorkspace({
  division,
  leaders,
  presentation,
  program,
  relatedPrograms,
}: ProgramDetailWorkspaceProps) {
  const coordinators = leaders.filter((leader) =>
    /ketua|kepala|sekretaris|bendahara/i.test(leader.role),
  )
  const peopleToShow = (coordinators.length > 0 ? coordinators : leaders).slice(0, 3)
  const activeMonths = new Set(program.months ?? [])

  return (
    <>
      <section className="program-compact-hero" aria-labelledby="program-title">
        <div className="org-shell">
          <nav className="program-compact-breadcrumb" aria-label="Navigasi program">
            <Link href="/program-kerja">Program kerja</Link>
            <span>→</span>
            <Link href={getDivisionHref(division.code)}>{division.shortName}</Link>
          </nav>

          <div className="program-compact-hero-grid">
            <div className="program-compact-copy">
              <div>
                <span>{presentation ? 'Program unggulan' : 'Program bidang'}</span>
                <strong>{program.status}</strong>
              </div>
              <h1 id="program-title">{program.name}</h1>
              <p>{presentation?.tagline ?? program.desc}</p>
              <dl aria-label="Ringkasan program">
                <div>
                  <dt>Bidang</dt>
                  <dd>{division.shortName}</dd>
                </div>
                <div>
                  <dt>Jadwal</dt>
                  <dd>{program.date}</dd>
                </div>
                <div>
                  <dt>Anggota bidang</dt>
                  <dd>{leaders.length}</dd>
                </div>
              </dl>
            </div>

            <figure className="program-compact-visual">
              <Image
                src={presentation?.image ?? divisionVisuals[division.code]}
                alt=""
                fill
                priority
                sizes="(max-width: 760px) 100vw, 42vw"
              />
              <figcaption>{division.name}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="program-compact-body">
        <div className="org-shell program-compact-grid">
          <article className="program-compact-summary">
            <header>
              <span>Ringkasan</span>
              <strong>{program.status}</strong>
            </header>
            <h2>{presentation?.summary ?? program.desc}</h2>
            {presentation ? (
              <ul>
                {presentation.focus.map((focus) => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            ) : (
              <p>
                Program ini berada di bawah {division.name}. Informasi pada halaman ini mengikuti
                daftar dan kalender kerja Kabinet Abya Vistara periode 2026/2027.
              </p>
            )}
            <Link href={getDivisionHref(division.code)}>Kenali {division.shortName} ↗</Link>
          </article>

          <section className="program-compact-calendar" aria-labelledby="program-calendar-title">
            <header>
              <span>Peta waktu</span>
              <h2 id="program-calendar-title">Kalender satu periode</h2>
            </header>
            <div className="program-month-grid" aria-label={`Bulan pelaksanaan: ${program.date}`}>
              {monthLabels.map((month, index) => (
                <span className={activeMonths.has(index + 1) ? 'is-active' : undefined} key={month}>
                  {month}
                </span>
              ))}
            </div>
            {presentation?.timeline.length ? (
              <div className="program-compact-timeline">
                {presentation.timeline.slice(0, 4).map((item, index) => (
                  <div key={`${item.label}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{item.label}</strong>
                    <time>{item.date}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p>{program.desc}</p>
            )}
          </section>

          <aside className="program-compact-navigation">
            <section>
              <header>
                <span>Pengurus bidang</span>
                <Link href={`/kepengurusan?divisi=${division.code}`}>Direktori</Link>
              </header>
              <div className="program-compact-people">
                {peopleToShow.map((leader) => (
                  <Link href={getLeaderHref(leader)} key={leader.name}>
                    <span aria-hidden="true">{getInitials(leader.name)}</span>
                    <div>
                      <strong>{leader.name}</strong>
                      <small>{leader.role}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <header>
                <span>Program satu bidang</span>
                <Link href="/program-kerja">Katalog</Link>
              </header>
              <div className="program-compact-related">
                {relatedPrograms.slice(0, 5).map((related) => (
                  <Link href={getProgramHref(related)} key={related.name}>
                    <strong>{related.name}</strong>
                    <span>{related.date}</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </>
  )
}
