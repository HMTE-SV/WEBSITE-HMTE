import Link from 'next/link'
import { ArchiveBoard } from '@/components/site/ArchiveBoard'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getLockedProjectCounts, getPublicDownloadProjects } from '@/lib/downloads-data'
import type { DownloadProjectType } from '@/lib/downloads'

/*
 * Halaman tetap dirender di server dan boleh di-cache, karena semua yang
 * sampai ke sini sudah disaring: project privat tidak ikut sama sekali, dan
 * dokumen privat datang tanpa alamat. Yang terkunci diurus ArchiveBoard di
 * sisi klien setelah kodenya terbukti.
 */

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

export async function ArchiveLibraryPage({ type }: { type: DownloadProjectType }) {
  const copy = pageCopy[type]
  const [projects, lockedCounts] = await Promise.all([
    getPublicDownloadProjects(type),
    getLockedProjectCounts(),
  ])
  const documentCount = projects.reduce((total, project) => total + project.documents.length, 0)
  const lockedCount = lockedCounts[type]

  return <PublicPageFrame activeHref={copy.activeHref}>
    <section className="archive-hero has-hero-backdrop" aria-labelledby="archive-title">
      <HeroBackdrop variant="dome" />
      <div className="soft-shell archive-hero-inner">
        <p>{copy.kicker}</p>
        <h1 id="archive-title">{copy.title} <span>{copy.accent}</span></h1>
        <div className="archive-hero-bottom">
          <p>{copy.lead}</p>
          <dl>
            <div><dt>Project</dt><dd>{String(projects.length + lockedCount).padStart(2, '0')}</dd></div>
            <div><dt>Dokumen</dt><dd>{String(documentCount).padStart(2, '0')}</dd></div>
            {lockedCount > 0 ? <div><dt>Terbatas</dt><dd>{String(lockedCount).padStart(2, '0')}</dd></div> : null}
          </dl>
        </div>
      </div>
    </section>

    <section className="archive-surface">
      <div className="soft-shell">
        <nav className="archive-switcher" aria-label="Jenis arsip">
          <Link href="/arsip" aria-current={type === 'archive' ? 'page' : undefined}>Arsip Dokumen</Link>
          <Link href="/template-dokumen" aria-current={type === 'template' ? 'page' : undefined}>Template Dokumen</Link>
        </nav>

        <ArchiveBoard
          emptyBody={copy.emptyBody}
          emptyTitle={copy.emptyTitle}
          lockedCount={lockedCount}
          projects={projects}
          type={type}
        />
      </div>
    </section>
  </PublicPageFrame>
}
