import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { getPublicDownloadProjects, type ResolvedDownloadDocument } from '@/lib/downloads-data'
import type { DownloadProjectType } from '@/lib/downloads'

const pageCopy = {
  archive: {
    activeHref: '/arsip',
    kicker: 'Pusat dokumentasi · HMTE TRE SV UGM',
    title: 'Arsip kegiatan,',
    accent: 'rapi dalam satu tempat.',
    lead: 'Temukan proposal, laporan, materi, dan dokumen kegiatan HMTE berdasarkan project atau acara yang menaunginya.',
    emptyTitle: 'Belum ada arsip yang diterbitkan',
    emptyBody: 'Project dokumentasi akan tampil di sini setelah dilengkapi dan diterbitkan oleh pengurus.',
  },
  template: {
    activeHref: '/template-dokumen',
    kicker: 'Perangkat kerja · HMTE TRE SV UGM',
    title: 'Template resmi,',
    accent: 'siap dipakai ulang.',
    lead: 'Kumpulan format surat, proposal, laporan, dan perangkat administrasi yang dapat dipakai lintas kegiatan.',
    emptyTitle: 'Belum ada template yang diterbitkan',
    emptyBody: 'Template resmi akan tampil di sini setelah disiapkan dan diterbitkan oleh pengurus.',
  },
} as const

function DocumentRow({ document }: { document: ResolvedDownloadDocument }) {
  const isPending = document.status === 'pending' || !document.available
  const content = <>
    <span className="archive-document-format">{document.format || '—'}</span>
    <span className="archive-document-copy"><strong>{document.title}</strong>{document.description ? <small>{document.description}</small> : null}</span>
    <span className="archive-document-size">{isPending ? 'Belum tersedia' : document.sizeLabel}</span>
    <span className="archive-document-action">{isPending ? 'Menyusul' : document.kind === 'external' ? 'Buka' : 'Unduh'}</span>
  </>

  if (isPending) return <div className="archive-document" data-pending="true" aria-disabled="true">{content}</div>

  return <a className="archive-document" href={document.href} {...(document.kind === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}>{content}</a>
}

export async function ArchiveLibraryPage({ type }: { type: DownloadProjectType }) {
  const copy = pageCopy[type]
  const projects = await getPublicDownloadProjects(type)
  const documentCount = projects.reduce((total, project) => total + project.documents.length, 0)

  return <PublicPageFrame activeHref={copy.activeHref}>
    <section className="archive-hero has-hero-backdrop" aria-labelledby="archive-title">
      <HeroBackdrop variant="dome" />
      <div className="soft-shell archive-hero-inner">
        <p>{copy.kicker}</p>
        <h1 id="archive-title">{copy.title} <span>{copy.accent}</span></h1>
        <div className="archive-hero-bottom">
          <p>{copy.lead}</p>
          <dl><div><dt>Project</dt><dd>{String(projects.length).padStart(2, '0')}</dd></div><div><dt>Dokumen</dt><dd>{String(documentCount).padStart(2, '0')}</dd></div></dl>
        </div>
      </div>
    </section>

    <section className="archive-surface">
      <div className="soft-shell">
        <nav className="archive-switcher" aria-label="Jenis arsip">
          <Link href="/arsip" aria-current={type === 'archive' ? 'page' : undefined}>Arsip Dokumen</Link>
          <Link href="/template-dokumen" aria-current={type === 'template' ? 'page' : undefined}>Template Dokumen</Link>
        </nav>

        {projects.length === 0 ? <EmptyState title={copy.emptyTitle} body={copy.emptyBody} /> : <div className="archive-projects">
          {projects.map((project, index) => <article className="archive-project" key={project.id}>
            <header>
              <div className="archive-project-index">{String(index + 1).padStart(2, '0')}</div>
              <div><p>{project.period || (type === 'archive' ? 'Project HMTE' : 'Template resmi')}</p><h2>{project.title}</h2>{project.description ? <span>{project.description}</span> : null}</div>
              <strong>{project.documents.length} dokumen</strong>
            </header>
            <div className="archive-documents">
              {project.documents.length > 0 ? project.documents.map((document) => <DocumentRow document={document} key={document.id} />) : <p className="archive-project-empty">Project ini belum memiliki dokumen publik.</p>}
            </div>
          </article>)}
        </div>}
      </div>
    </section>
  </PublicPageFrame>
}
