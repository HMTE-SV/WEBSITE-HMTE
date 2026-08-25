'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DownloadProjectType } from '@/lib/downloads'
import type { ResolvedDownloadDocument, ResolvedDownloadProject, UnlockedArchive } from '@/lib/downloads-data'

/*
 * Daftar arsip beserta gerbang kodenya.
 *
 * Dirender di klien, bukan karena butuh interaksi mewah, melainkan karena isi
 * privat tidak boleh pernah masuk HTML yang dibuat sekali lalu dibagikan ke
 * semua pengunjung. Bagian publik datang sebagai props dari halaman statis;
 * bagian privat diminta terpisah setelah kodenya terbukti, dan hidup hanya di
 * memori tab ini.
 */

type ArchiveBoardProps = {
  type: DownloadProjectType
  projects: ResolvedDownloadProject[]
  lockedCount: number
  emptyTitle: string
  emptyBody: string
}

/**
 * Isi privat tidak pernah ikut props: ia selalu diminta terpisah, dan gagalnya
 * permintaan ini bukan kesalahan yang perlu ditampilkan — artinya hanya belum
 * ada yang terbuka.
 */
async function fetchUnlocked(type: DownloadProjectType): Promise<UnlockedArchive | null> {
  try {
    const response = await fetch(`/api/arsip/terbuka?type=${type}`, { cache: 'no-store' })
    return response.ok ? await response.json() as UnlockedArchive : null
  } catch {
    return null
  }
}

function DocumentRow({ document }: { document: ResolvedDownloadDocument }) {
  const isLockedStub = document.locked && !document.href
  const isPending = !isLockedStub && (document.status === 'pending' || !document.available)

  const content = <>
    <span className="archive-document-format">{document.format || '—'}</span>
    <span className="archive-document-copy">
      <strong>{document.title}</strong>
      {document.description ? <small>{document.description}</small> : null}
    </span>
    <span className="archive-document-size">
      {isLockedStub ? 'Terbatas' : isPending ? 'Belum tersedia' : document.sizeLabel}
    </span>
    <span className="archive-document-action">
      {isLockedStub ? 'Terkunci' : isPending ? 'Menyusul' : document.kind === 'external' ? 'Buka' : 'Unduh'}
    </span>
  </>

  if (isLockedStub) {
    return <div className="archive-document" data-locked="true" aria-disabled="true">{content}</div>
  }

  if (isPending) {
    return <div className="archive-document" data-pending="true" aria-disabled="true">{content}</div>
  }

  /*
   * Dokumen privat selalu dibuka di tab baru, tidak pernah dengan atribut
   * download. Yang datang dari rute bergerbang bisa juga berupa penolakan
   * berbentuk JSON, dan unduhan paksa akan menyimpannya sebagai berkas rusak
   * alih-alih menampilkan sebabnya.
   */
  const linkProps = document.locked
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : document.kind === 'external'
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : { download: true }

  return <a className="archive-document" data-unlocked={document.locked || undefined} href={document.href} {...linkProps}>{content}</a>
}

function ProjectCard({ project, index }: { project: ResolvedDownloadProject; index: number }) {
  const isPrivate = project.visibility === 'private'

  return <article className="archive-project" data-private={isPrivate || undefined}>
    <header>
      <div className="archive-project-index">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <p>{project.period || (project.type === 'archive' ? 'Project HMTE' : 'Template resmi')}</p>
        <h2>{project.title}{isPrivate ? <span className="archive-private-tag">Terbatas</span> : null}</h2>
        {project.description ? <span>{project.description}</span> : null}
      </div>
      <strong>{project.documents.length} dokumen</strong>
    </header>
    <div className="archive-documents">
      {project.documents.length > 0
        ? project.documents.map((document) => <DocumentRow document={document} key={document.id} />)
        : <p className="archive-project-empty">Project ini belum memiliki dokumen publik.</p>}
    </div>
  </article>
}

export function ArchiveBoard({ type, projects, lockedCount, emptyTitle, emptyBody }: ArchiveBoardProps) {
  const [unlocked, setUnlocked] = useState<UnlockedArchive>({ projects: [], revealed: {} })
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Sesi yang masih hidup dari kunjungan sebelumnya dipulihkan tanpa bertanya
  // lagi. Kukinya httpOnly, jadi hanya server yang bisa menjawab pertanyaan ini.
  useEffect(() => {
    let cancelled = false
    fetchUnlocked(type).then((result) => {
      if (!cancelled && result) setUnlocked(result)
    })
    return () => { cancelled = true }
  }, [type])

  const merged = useMemo(() => {
    const withRevealed = projects.map((project) => {
      const revealed = unlocked.revealed[project.id]
      if (!revealed || revealed.length === 0) return project

      const byId = new Map(revealed.map((document) => [document.id, document]))
      return { ...project, documents: project.documents.map((document) => byId.get(document.id) ?? document) }
    })

    return [...withRevealed, ...unlocked.projects].sort((first, second) => first.order - second.order)
  }, [projects, unlocked])

  const remainingLocked = useMemo(() => {
    const lockedDocuments = merged.reduce(
      (total, project) => total + project.documents.filter((document) => document.locked && !document.href).length,
      0,
    )
    return { projects: Math.max(0, lockedCount - unlocked.projects.length), documents: lockedDocuments }
  }, [lockedCount, merged, unlocked.projects.length])

  const hasUnlockedSomething = unlocked.projects.length > 0 || Object.keys(unlocked.revealed).length > 0
  const showGate = remainingLocked.projects > 0 || remainingLocked.documents > 0 || hasUnlockedSomething

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/arsip/buka', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const result = await response.json().catch(() => null) as { unlocked?: number; error?: string } | null

      if (!response.ok) {
        setError(result?.error || 'Kode akses tidak dikenali.')
        return
      }

      setCode('')
      setNotice(`${result?.unlocked ?? 1} arsip terbuka untuk sesi ini.`)
      const refreshed = await fetchUnlocked(type)
      if (refreshed) setUnlocked(refreshed)
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi lalu coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLock() {
    await fetch('/api/arsip/kunci', { method: 'POST' })
    setUnlocked({ projects: [], revealed: {} })
    setNotice('')
    setError('')
  }

  return <>
    {showGate ? <section className="archive-vault" aria-labelledby="archive-vault-title">
      <div className="archive-vault-copy">
        <p>Akses terbatas</p>
        <h2 id="archive-vault-title">
          {remainingLocked.projects > 0 || remainingLocked.documents > 0
            ? 'Sebagian arsip hanya untuk pemegang kode.'
            : 'Arsip terbatas sedang terbuka.'}
        </h2>
        <span>
          {remainingLocked.projects > 0 ? `${remainingLocked.projects} project` : ''}
          {remainingLocked.projects > 0 && remainingLocked.documents > 0 ? ' dan ' : ''}
          {remainingLocked.documents > 0 ? `${remainingLocked.documents} dokumen` : ''}
          {remainingLocked.projects > 0 || remainingLocked.documents > 0
            ? ' masih terkunci. Masukkan kode yang diberikan pengurus untuk membukanya.'
            : 'Akses berlaku delapan jam, atau sampai dikunci kembali.'}
        </span>
      </div>

      <form className="archive-vault-form" onSubmit={(event) => void handleSubmit(event)}>
        <label htmlFor="archive-code">Kode akses</label>
        <div>
          <input
            id="archive-code"
            name="archive-code"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="Masukkan kode"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button type="submit" disabled={isSubmitting || code.trim().length === 0}>
            {isSubmitting ? 'Memeriksa...' : 'Buka'}
          </button>
        </div>
        {error ? <p className="archive-vault-error" role="alert">{error}</p> : null}
        {notice ? <p className="archive-vault-notice" role="status">{notice}</p> : null}
        {hasUnlockedSomething
          ? <button className="archive-vault-lock" type="button" onClick={() => void handleLock()}>Kunci lagi sekarang</button>
          : null}
      </form>
    </section> : null}

    {merged.length === 0
      // Markup EmptyState disalin, bukan diimpor: modul PublicPage adalah modul
      // server, dan menariknya ke sini akan ikut menyeret pengambilan datanya.
      ? <div className="public-empty">
        <h3>{emptyTitle}</h3>
        <p>{emptyBody}</p>
      </div>
      : <div className="archive-projects">
        {merged.map((project, index) => <ProjectCard index={index} key={project.id} project={project} />)}
      </div>}
  </>
}
