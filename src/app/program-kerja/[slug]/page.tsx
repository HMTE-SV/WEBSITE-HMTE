import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame, PublicSection } from '@/components/site/PublicPage'
import { featuredProgramPresentations } from '@/data/program-presentations'
import type { ProgramDocumentItem } from '@/data/program-presentations'
import { getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref, toOrganizationSlug } from '@/lib/organization-slugs'
import type { ProgramStatus } from '@/types/content'

type ProgramDetailPageProps = {
  params: Promise<{ slug: string }>
}

function getStatusClass(status: ProgramStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

function getDocumentStatusClass(status: ProgramDocumentItem['status']) {
  return status === 'Tersedia' ? 'is-ready' : undefined
}

export function generateStaticParams() {
  return featuredProgramPresentations.map((presentation) => ({
    slug: toOrganizationSlug(presentation.programName),
  }))
}

export async function generateMetadata({ params }: ProgramDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const presentation = featuredProgramPresentations.find(
    (item) => toOrganizationSlug(item.programName) === slug,
  )

  if (!presentation) {
    return { title: 'Program kerja tidak ditemukan' }
  }

  return {
    title: `${presentation.programName} — Program Unggulan HMTE`,
    description: presentation.summary,
  }
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const [{ slug }, organization] = await Promise.all([params, getOrganizationData()])
  const presentation = featuredProgramPresentations.find(
    (item) => toOrganizationSlug(item.programName) === slug,
  )

  if (!presentation) {
    notFound()
  }

  const division = organization.divisionsByCode[presentation.divisionCode]
  const program = organization.programsByDivision[presentation.divisionCode].find(
    (item) => item.name === presentation.programName,
  )

  if (!division || !program) {
    notFound()
  }

  const relatedPrograms = organization.programsByDivision[presentation.divisionCode].filter(
    (item) => item.name !== program.name,
  )

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <section className="program-detail-hero">
        <Image src={presentation.image} alt="" fill priority sizes="100vw" />
        <div className="program-detail-overlay" />
        <div className="public-shell program-detail-hero-content">
          <Link className="program-detail-back" href="/program-kerja">Program Kerja</Link>
          <div className="program-detail-hero-layout">
            <div>
              <div className="program-detail-eyebrow">
                <span>Unggulan</span>
                <strong>{division.shortName}</strong>
              </div>
              <h1>{program.name}</h1>
              <p>{presentation.tagline}</p>
            </div>
            <aside className="program-detail-brief" aria-label="Ringkasan program">
              <div>
                <span>Status</span>
                <strong className={getStatusClass(program.status)}>{program.status}</strong>
              </div>
              <div>
                <span>Periode</span>
                <strong>{program.date}</strong>
              </div>
              <div>
                <span>Penanggung jawab</span>
                <strong>{division.shortName}</strong>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <nav className="program-detail-nav" aria-label={`Navigasi ${program.name}`}>
        <div className="public-shell">
          <a href="#ringkasan">Ringkasan</a>
          <a href="#fokus">Fokus</a>
          <a href="#timeline">Timeline</a>
          <a href="#dokumen">Dokumen</a>
        </div>
      </nav>

      <PublicSection>
        <div className="program-detail-overview" id="ringkasan">
          <div>
            <span className="public-label">Tentang program</span>
            <h2>Ruang kerja yang terbuka dan mudah dipantau.</h2>
          </div>
          <div className="program-detail-summary">
            <p>{presentation.summary}</p>
            <p>{program.desc}</p>
            <Link href={getDivisionHref(division.code)}>Kenali {division.name}</Link>
          </div>
        </div>
      </PublicSection>

      <PublicSection title="Fokus program">
        <div className="program-focus-grid" id="fokus">
          {presentation.focus.map((item, index) => (
            <article key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Timeline pelaksanaan">
        <ol className="program-detail-timeline" id="timeline">
          {presentation.timeline.map((item, index) => (
            <li className={`is-${item.state}`} key={`${item.date}-${item.label}`}>
              <div className="program-timeline-marker">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <time>{item.date}</time>
              <div>
                <h3>{item.label}</h3>
                <p>{item.description}</p>
              </div>
              <strong>{item.state === 'done' ? 'Selesai' : item.state === 'active' ? 'Berjalan' : 'Berikutnya'}</strong>
            </li>
          ))}
        </ol>
      </PublicSection>

      <PublicSection title="Dokumen program">
        <div className="program-document-list" id="dokumen">
          {presentation.documents.map((document, index) => (
            <article key={document.name}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{document.name}</h3>
                <p>{document.format}</p>
              </div>
              <strong className={getDocumentStatusClass(document.status)}>{document.status}</strong>
            </article>
          ))}
        </div>
        <p className="program-document-note">
          Area ini sudah disiapkan untuk proposal, panduan, rundown, laporan, dan berkas publik lainnya.
        </p>
      </PublicSection>

      {relatedPrograms.length > 0 ? (
        <PublicSection title={`Program lain dari ${division.shortName}`}>
          <div className="program-related-grid">
            {relatedPrograms.map((relatedProgram) => (
              <article key={relatedProgram.name}>
                <span>{relatedProgram.status}</span>
                <h3>{relatedProgram.name}</h3>
                <p>{relatedProgram.desc}</p>
                <time>{relatedProgram.date}</time>
              </article>
            ))}
          </div>
        </PublicSection>
      ) : null}
    </PublicPageFrame>
  )
}
