'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminDrawer } from './AdminDrawer'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import { clearProjectAccessCode, fetchProjectsWithAccessCode, setProjectAccessCode } from '@/lib/admin/archive-codes'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument, writeContentDocumentAtId } from '@/lib/firebase/content-services'
import {
  DOWNLOADS_ID,
  DOWNLOADS_PRIVATE_DIR,
  DOWNLOADS_PRIVATE_ID,
  DOWNLOADS_PUBLIC_DIR,
  defaultDownloadsIndex,
  makeDownloadDocumentId,
  makeDownloadProjectId,
  normalizeDownloadsIndex,
  redactDownloadsIndexForPublic,
  resolveDocumentVisibility,
  validateDownloadProjects,
  type DownloadDocument,
  type DownloadKind,
  type DownloadProject,
  type DownloadProjectStatus,
  type DownloadProjectType,
  type DownloadStatus,
  type DownloadVisibility,
  type DownloadsValidationIssue,
} from '@/lib/downloads'
import type { DownloadsDocument } from '@/types/firestore'

const projectTypeLabels: Record<DownloadProjectType, string> = {
  archive: 'Arsip dokumen',
  template: 'Template dokumen',
}

const projectStatusLabels: Record<DownloadProjectStatus, string> = {
  published: 'Tampil',
  hidden: 'Disembunyikan',
}

const documentStatusLabels: Record<DownloadStatus, string> = {
  ready: 'Siap',
  pending: 'Menyusul',
  hidden: 'Disembunyikan',
}

const kindLabels: Record<DownloadKind, string> = {
  file: 'Berkas di repo',
  external: 'Tautan eksternal',
}

const visibilityLabels: Record<DownloadVisibility, string> = {
  public: 'Publik',
  private: 'Privat',
}

type ProjectFilter = 'all' | DownloadProjectType
type EditorState =
  | { kind: 'project'; projectId: string }
  | { kind: 'document'; projectId: string; documentId: string }
  | null
type DeleteTarget =
  | { kind: 'project'; project: DownloadProject }
  | { kind: 'document'; projectId: string; document: DownloadDocument }
  | null

function makeBlankProject(order: number, type: DownloadProjectType): DownloadProject {
  return {
    id: makeDownloadProjectId(),
    title: '',
    description: '',
    type,
    period: '',
    status: 'hidden',
    order,
    visibility: 'public',
    hasAccessCode: false,
    documents: [],
  }
}

function makeBlankDocument(order: number): DownloadDocument {
  return {
    id: makeDownloadDocumentId(),
    title: '',
    description: '',
    kind: 'external',
    path: '',
    externalUrl: '',
    format: '',
    status: 'pending',
    order,
    visibility: 'public',
  }
}

function reindexProjects(projects: DownloadProject[]) {
  return projects.map((project, order) => ({ ...project, order }))
}

function reindexDocuments(documents: DownloadDocument[]) {
  return documents.map((document, order) => ({ ...document, order }))
}

export function AdminDownloadsManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [projects, setProjects] = useState<DownloadProject[]>([])
  const [loadedSnapshot, setLoadedSnapshot] = useState(JSON.stringify([]))
  const [exists, setExists] = useState(false)
  const [mirrorExists, setMirrorExists] = useState(false)
  const [codeDraft, setCodeDraft] = useState('')
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeFeedback, setCodeFeedback] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [issues, setIssues] = useState<DownloadsValidationIssue[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editor, setEditor] = useState<EditorState>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

  const isDirty = JSON.stringify(projects) !== loadedSnapshot
  useUnsavedChangesGuard(canWrite && isDirty)

  /*
   * Sumber kebenaran adalah `downloadsPrivate/index`; `downloads/index` hanya
   * salinan tersaringnya. Panel membaca yang pertama, dan jatuh ke yang kedua
   * hanya kalau induknya belum pernah dibuat — itulah jalur pindahan untuk
   * arsip yang sudah ada sebelum kode akses diperkenalkan.
   */
  useEffect(() => {
    if (!hasFirebaseConfig()) return
    let cancelled = false

    async function load() {
      const [master, mirror] = await Promise.all([
        getContentDocument<DownloadsDocument>('downloadsPrivate', DOWNLOADS_PRIVATE_ID),
        getContentDocument<DownloadsDocument>('downloads', DOWNLOADS_ID),
      ])
      const source = master ?? mirror
      const normalized = source ? normalizeDownloadsIndex(source as Record<string, unknown>) : defaultDownloadsIndex

      /*
       * `hasAccessCode` tidak ikut tersimpan di dokumen sebagai kebenaran, ia
       * hanya cerminan. Yang menentukan adalah ada tidaknya catatan di
       * `archiveAccess`, dan hanya server yang bisa menjawabnya. Kalau jawaban
       * itu tidak datang, penanda dibiarkan apa adanya daripada menampilkan
       * kunci yang sebenarnya tidak ada.
       */
      const withCodes = await fetchProjectsWithAccessCode()
        .then((ids) => {
          const owned = new Set(ids)
          return normalized.projects.map((project) => ({ ...project, hasAccessCode: owned.has(project.id) }))
        })
        .catch(() => normalized.projects)

      if (cancelled) return
      setProjects(withCodes)
      setLoadedSnapshot(JSON.stringify(withCodes))
      setSelectedProjectId(withCodes[0]?.id ?? null)
      setExists(Boolean(master))
      setMirrorExists(Boolean(mirror))
      setIsLoading(false)
    }

    load().catch((error: unknown) => {
      if (cancelled) return
      setLoadError(error instanceof Error ? error.message : 'Gagal memuat pusat arsip.')
      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesType = projectFilter === 'all' || project.type === projectFilter
      const matchesQuery = !query
        || project.title.toLowerCase().includes(query)
        || project.description.toLowerCase().includes(query)
        || project.documents.some((document) => document.title.toLowerCase().includes(query))
      return matchesType && matchesQuery
    })
  }, [projectFilter, projects, searchQuery])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? filteredProjects[0] ?? null
  const projectEditor = editor?.kind === 'project' ? projects.find((project) => project.id === editor.projectId) ?? null : null
  const documentEditorProject = editor?.kind === 'document' ? projects.find((project) => project.id === editor.projectId) ?? null : null
  const documentEditor = editor?.kind === 'document'
    ? documentEditorProject?.documents.find((document) => document.id === editor.documentId) ?? null
    : null
  const projectIssues = selectedProject ? issues.filter((issue) => issue.projectId === selectedProject.id) : []
  const editorIssues = editor?.kind === 'project'
    ? issues.filter((issue) => issue.projectId === editor.projectId && !issue.documentId)
    : editor?.kind === 'document'
      ? issues.filter((issue) => issue.projectId === editor.projectId && issue.documentId === editor.documentId)
      : []
  const documentCount = projects.reduce((total, project) => total + project.documents.length, 0)

  function clearFeedback() { setFeedback('') }

  /*
   * Satu-satunya cara membuka atau menutup drawer.
   *
   * Kode yang sudah diketik untuk satu project tidak boleh terbawa saat drawer
   * berpindah ke project lain — itu cara termudah memasang kode ke arsip yang
   * salah. Dibereskan di sini, bukan lewat effect, supaya pembersihannya
   * terjadi bersamaan dengan perpindahannya alih-alih satu render setelahnya.
   */
  function openEditor(next: EditorState) {
    setEditor(next)
    setCodeDraft('')
    setCodeError('')
    setCodeFeedback('')
  }

  function updateProject(projectId: string, patch: Partial<DownloadProject>) {
    setProjects((current) => current.map((project) => project.id === projectId ? { ...project, ...patch } : project))
    clearFeedback()
  }

  function updateDocument(projectId: string, documentId: string, patch: Partial<DownloadDocument>) {
    setProjects((current) => current.map((project) => project.id === projectId
      ? { ...project, documents: project.documents.map((document) => document.id === documentId ? { ...document, ...patch } : document) }
      : project))
    clearFeedback()
  }

  function addProject() {
    const type = projectFilter === 'all' ? 'archive' : projectFilter
    const project = makeBlankProject(projects.length, type)
    setProjects((current) => [...current, project])
    setSelectedProjectId(project.id)
    openEditor({ kind: 'project', projectId: project.id })
    clearFeedback()
  }

  function addDocument(projectId: string) {
    const project = projects.find((candidate) => candidate.id === projectId)
    if (!project) return
    const document = makeBlankDocument(project.documents.length)
    updateProject(projectId, { documents: [...project.documents, document] })
    openEditor({ kind: 'document', projectId, documentId: document.id })
  }

  function moveProject(projectId: string, direction: -1 | 1) {
    setProjects((current) => {
      const index = current.findIndex((project) => project.id === projectId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return reindexProjects(next)
    })
    clearFeedback()
  }

  function moveDocument(projectId: string, documentId: string, direction: -1 | 1) {
    const project = projects.find((candidate) => candidate.id === projectId)
    if (!project) return
    const index = project.documents.findIndex((document) => document.id === documentId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= project.documents.length) return
    const documents = [...project.documents]
    ;[documents[index], documents[target]] = [documents[target], documents[index]]
    updateProject(projectId, { documents: reindexDocuments(documents) })
  }

  /*
   * Kode akses tidak ikut antre di tombol "Simpan pusat arsip".
   *
   * Ia tinggal di koleksi lain yang hanya bisa disentuh lewat rute server, dan
   * menggabungkannya ke satu tombol berarti satu kegagalan bisa menyimpan
   * daftar tanpa kuncinya. Dipisah, keduanya gagal atau berhasil sendiri-sendiri
   * dan pengurus melihat mana yang mana.
   */
  async function saveAccessCode(projectId: string) {
    setCodeBusy(true)
    setCodeError('')
    setCodeFeedback('')
    try {
      await setProjectAccessCode(projectId, codeDraft)
      updateProject(projectId, { hasAccessCode: true })
      setCodeDraft('')
      setCodeFeedback('Kode akses tersimpan.')
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Gagal menyimpan kode akses.')
    } finally {
      setCodeBusy(false)
    }
  }

  async function removeAccessCode(projectId: string) {
    setCodeBusy(true)
    setCodeError('')
    setCodeFeedback('')
    try {
      await clearProjectAccessCode(projectId)
      updateProject(projectId, { hasAccessCode: false })
      setCodeFeedback('Kode akses dicabut. Sesi yang sudah terbuka akan berakhir sendiri paling lama delapan jam.')
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Gagal mencabut kode akses.')
    } finally {
      setCodeBusy(false)
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.kind === 'project') {
      const id = deleteTarget.project.id
      // Kode tanpa project adalah kunci untuk pintu yang sudah dibongkar, dan
      // id yang sama bisa saja lahir lagi. Dicabut bersamaan dengan projectnya.
      if (deleteTarget.project.hasAccessCode) {
        void clearProjectAccessCode(id).catch((error: unknown) => {
          setCodeError(error instanceof Error ? error.message : 'Kode akses project ini gagal dicabut.')
        })
      }
      const next = reindexProjects(projects.filter((project) => project.id !== id))
      setProjects(next)
      setSelectedProjectId((current) => current === id ? next[0]?.id ?? null : current)
      setIssues((current) => current.filter((issue) => issue.projectId !== id))
    } else {
      const { projectId, document } = deleteTarget
      const project = projects.find((candidate) => candidate.id === projectId)
      if (project) updateProject(projectId, { documents: reindexDocuments(project.documents.filter((item) => item.id !== document.id)) })
      setIssues((current) => current.filter((issue) => issue.documentId !== document.id))
    }
    openEditor(null)
    setDeleteTarget(null)
    clearFeedback()
  }

  async function handleSave() {
    const validationIssues = validateDownloadProjects(projects)
    setIssues(validationIssues)
    clearFeedback()
    if (validationIssues.length > 0) {
      const first = validationIssues[0]
      setSelectedProjectId(first.projectId)
      openEditor(first.documentId
        ? { kind: 'document', projectId: first.projectId, documentId: first.documentId }
        : { kind: 'project', projectId: first.projectId })
      return
    }

    setIsSaving(true)
    try {
      /*
       * Induk lebih dulu, salinan publik menyusul.
       *
       * Urutannya penting saat penyimpanan gagal di tengah: yang tertinggal
       * adalah salinan publik yang usang tetapi tetap tidak membocorkan apa
       * pun. Urutan terbalik akan sempat menerbitkan daftar yang isinya belum
       * ada di induk.
       */
      const master = { projects, lockedProjects: defaultDownloadsIndex.lockedProjects, updatedBy: session.email }
      const publicMirror = redactDownloadsIndexForPublic(master)

      await writeContentDocumentAtId<DownloadsDocument>('downloadsPrivate', DOWNLOADS_PRIVATE_ID, master, exists)
      await writeContentDocumentAtId<DownloadsDocument>('downloads', DOWNLOADS_ID, publicMirror, mirrorExists)

      setLoadedSnapshot(JSON.stringify(projects))
      setExists(true)
      setMirrorExists(true)
      setFeedback('Pusat arsip tersimpan dan halaman publik sedang diperbarui.')
      await requestRevalidation('downloads')
    } catch (error) {
      setIssues([{ projectId: '', field: '', message: error instanceof Error ? error.message : 'Gagal menyimpan pusat arsip.' }])
    } finally {
      setIsSaving(false)
    }
  }

  const primaryAction = canWrite ? <button className="adm-btn" type="button" onClick={addProject}>+ Project baru</button> : null

  return <AdminShell activeHref="/admin/downloads" title="Pusat arsip" actions={primaryAction}>
    {!hasFirebaseConfig() ? <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola arsip." title="Firebase belum siap." />
      : isLoading ? <div className="adp-skeleton-list" aria-hidden="true">{Array.from({ length: 5 }).map((_, index) => <div className="adm-skeleton adp-skeleton-row" key={index} />)}</div>
      : loadError ? <AdminEmptyState body={loadError} title="Pusat arsip tidak dapat dibaca." />
      : <>
        <section className="adm-archive-summary" aria-label="Ringkasan pusat arsip">
          <div><strong>{projects.length}</strong><span>Project</span></div>
          <div><strong>{documentCount}</strong><span>Dokumen</span></div>
          <div><strong>{projects.filter((project) => project.type === 'template').length}</strong><span>Folder template</span></div>
          <div><strong>{projects.filter((project) => project.visibility === 'private').length}</strong><span>Project privat</span></div>
          <p>Satu project menyimpan semua proposal, laporan, materi, atau template yang masih berkaitan. Pengunjung melihatnya sebagai satu folder utuh. Project privat tidak ikut ke halaman publik sama sekali sampai kodenya dimasukkan.</p>
        </section>

        <div className="adm-archive-toolbar">
          <label><span className="sr-only">Cari project atau dokumen</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari project atau dokumen..." /></label>
          <div role="group" aria-label="Saring jenis project">
            {(['all', 'archive', 'template'] as ProjectFilter[]).map((value) => <button type="button" aria-pressed={projectFilter === value} key={value} onClick={() => setProjectFilter(value)}>{value === 'all' ? 'Semua' : projectTypeLabels[value]}</button>)}
          </div>
        </div>

        {issues.some((issue) => !issue.projectId) ? <p className="adp-inline-error" role="alert">{issues.find((issue) => !issue.projectId)?.message}</p> : null}
        {feedback ? <p className="adp-inline-success" role="status">{feedback}</p> : null}

        <div className="adm-archive-workspace">
          <aside className="adm-archive-project-list" aria-label="Daftar project">
            <div className="adm-archive-list-head"><strong>Project / folder</strong><span>{filteredProjects.length}</span></div>
            {filteredProjects.length === 0 ? <p className="adm-archive-list-empty">Tidak ada project yang cocok.</p> : filteredProjects.map((project) => {
              const invalid = issues.some((issue) => issue.projectId === project.id)
              return <button className={selectedProject?.id === project.id ? 'is-active' : ''} data-invalid={invalid || undefined} type="button" key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                <span>{project.type === 'archive' ? 'Arsip' : 'Template'}{project.visibility === 'private' ? ' · Privat' : ''}</span>
                <strong>{project.title || 'Project baru'}</strong>
                <small>{project.period || 'Tanpa periode'} · {project.documents.length} dokumen{project.hasAccessCode ? ' · berkode' : ''}</small>
              </button>
            })}
          </aside>

          <section className="adm-archive-project-panel">
            {!selectedProject ? <AdminEmptyState title="Pilih atau buat project" body="Project akan menjadi folder utama untuk dokumen dari kegiatan atau kebutuhan yang sama." action={primaryAction} /> : <>
              <header className="adm-archive-project-head">
                <div>
                  <p>{projectTypeLabels[selectedProject.type]} · {projectStatusLabels[selectedProject.status]} · {visibilityLabels[selectedProject.visibility]}{selectedProject.visibility === 'private' && !selectedProject.hasAccessCode ? ' · belum berkode' : ''}</p>
                  <h2>{selectedProject.title || 'Project baru'}</h2>
                  <span>{selectedProject.description || 'Tambahkan deskripsi singkat agar isi folder mudah dipahami.'}</span>
                </div>
                <div className="adm-archive-project-actions">
                  <button className="adm-btn adm-btn--ghost" type="button" disabled={!canWrite} onClick={() => openEditor({ kind: 'project', projectId: selectedProject.id })}>Atur project</button>
                  <button className="adm-btn" type="button" disabled={!canWrite} onClick={() => addDocument(selectedProject.id)}>+ Tambah dokumen</button>
                </div>
              </header>

              {projectIssues.length > 0 ? <div className="adp-inline-error" role="alert"><p>{projectIssues.length} isian dalam project ini perlu diperbaiki.</p></div> : null}

              {selectedProject.documents.length === 0 ? <div className="adm-archive-doc-empty"><strong>Folder ini masih kosong.</strong><p>Tambahkan proposal, laporan, materi, atau file lain yang masih satu konteks dengan project ini.</p>{canWrite ? <button className="adm-btn" type="button" onClick={() => addDocument(selectedProject.id)}>Tambah dokumen pertama</button> : null}</div>
                : <div className="adm-archive-documents">
                  <div className="adm-archive-documents-head"><span>Dokumen</span><span>Format</span><span>Status</span><span>Aksi</span></div>
                  {selectedProject.documents.map((document, index) => {
                    const invalid = issues.some((issue) => issue.documentId === document.id)
                    return <article className="adm-archive-document-row" data-invalid={invalid || undefined} key={document.id}>
                      <div><strong>{document.title || 'Dokumen baru'}</strong><small>{document.description || kindLabels[document.kind]}</small></div>
                      <span>{document.format || '—'}{resolveDocumentVisibility(selectedProject, document) === 'private' ? ' · privat' : ''}</span>
                      <span className={`adm-chip ${document.status === 'ready' ? 'adm-chip--ok' : document.status === 'pending' ? 'adm-chip--warn' : ''}`}>{documentStatusLabels[document.status]}</span>
                      <div className="adm-row-actions">
                        <button type="button" aria-label="Naikkan dokumen" disabled={!canWrite || index === 0} onClick={() => moveDocument(selectedProject.id, document.id, -1)}>↑</button>
                        <button type="button" aria-label="Turunkan dokumen" disabled={!canWrite || index === selectedProject.documents.length - 1} onClick={() => moveDocument(selectedProject.id, document.id, 1)}>↓</button>
                        <button className="adm-btn adm-btn--ghost" type="button" onClick={() => openEditor({ kind: 'document', projectId: selectedProject.id, documentId: document.id })}>{canWrite ? 'Edit' : 'Lihat'}</button>
                      </div>
                    </article>
                  })}
                </div>}

              <footer className="adm-archive-order"><span>Urutan project pada halaman publik</span><div><button type="button" disabled={!canWrite || selectedProject.order === 0} onClick={() => moveProject(selectedProject.id, -1)}>Naik</button><button type="button" disabled={!canWrite || selectedProject.order === projects.length - 1} onClick={() => moveProject(selectedProject.id, 1)}>Turun</button></div></footer>
            </>}
          </section>
        </div>

        {canWrite ? <div className="adp-save-bar"><span>{isDirty ? 'Perubahan belum disimpan' : 'Semua perubahan tersimpan'}</span><button className="adm-btn" type="button" disabled={isSaving || !isDirty} onClick={() => void handleSave()}>{isSaving ? 'Menyimpan...' : 'Simpan pusat arsip'}</button></div> : null}
      </>}

    {projectEditor ? <AdminDrawer title={projectEditor.title || 'Project baru'} isDirty={false} onClose={() => openEditor(null)} footer={<><button className="adm-btn adm-btn--danger" type="button" disabled={!canWrite} onClick={() => setDeleteTarget({ kind: 'project', project: projectEditor })}>Hapus project</button><button className="adm-btn" type="button" onClick={() => openEditor(null)}>Selesai</button></>}>
      {editorIssues.length > 0 ? <div className="adp-inline-error" role="alert">{editorIssues.map((issue) => <p key={issue.field}>{issue.message}</p>)}</div> : null}
      <div className="adm-field"><label htmlFor="project-title">Nama project / kegiatan</label><input id="project-title" disabled={!canWrite} maxLength={160} value={projectEditor.title} placeholder="Contoh: Open House 2026" onChange={(event) => updateProject(projectEditor.id, { title: event.target.value })} /></div>
      <div className="adm-field"><label htmlFor="project-type">Jenis project</label><select id="project-type" disabled={!canWrite} value={projectEditor.type} onChange={(event) => updateProject(projectEditor.id, { type: event.target.value as DownloadProjectType })}><option value="archive">Arsip dokumen yang sudah dibuat</option><option value="template">Template dokumen yang dapat dipakai ulang</option></select></div>
      <div className="adm-field"><label htmlFor="project-period">Periode / tahun</label><input id="project-period" disabled={!canWrite} maxLength={40} value={projectEditor.period} placeholder="2026 atau 2026/2027" onChange={(event) => updateProject(projectEditor.id, { period: event.target.value })} /></div>
      <div className="adm-field"><label htmlFor="project-status">Tampilan publik</label><select id="project-status" disabled={!canWrite} value={projectEditor.status} onChange={(event) => updateProject(projectEditor.id, { status: event.target.value as DownloadProjectStatus })}><option value="hidden">Sembunyikan project</option><option value="published">Tampilkan di website</option></select><small>Project baru disembunyikan agar folder kosong tidak langsung muncul.</small></div>

      <div className="adm-field"><label htmlFor="project-visibility">Sifat arsip</label><select id="project-visibility" disabled={!canWrite} value={projectEditor.visibility} onChange={(event) => updateProject(projectEditor.id, { visibility: event.target.value as DownloadVisibility })}><option value="public">Publik — siapa pun boleh membuka</option><option value="private">Privat — hanya pemegang kode akses</option></select><small>{projectEditor.visibility === 'private' ? 'Judul project pun tidak ikut ke halaman publik. Pengunjung hanya melihat bahwa ada arsip terbatas.' : 'Dokumen di dalamnya masih bisa dijadikan privat satu per satu.'}</small></div>

      <div className="adm-field">
        <label htmlFor="project-code">Kode akses</label>
        <div className="adm-archive-code-row">
          <input id="project-code" type="text" autoComplete="off" spellCheck={false} disabled={!canWrite || codeBusy} value={codeDraft} placeholder={projectEditor.hasAccessCode ? 'Kode sudah terpasang — isi untuk mengganti' : 'Minimal 6 karakter'} onChange={(event) => { setCodeDraft(event.target.value); setCodeError(''); setCodeFeedback('') }} />
          <button className="adm-btn" type="button" disabled={!canWrite || codeBusy || codeDraft.trim().length < 6} onClick={() => void saveAccessCode(projectEditor.id)}>{codeBusy ? 'Menyimpan...' : projectEditor.hasAccessCode ? 'Ganti' : 'Pasang'}</button>
        </div>
        {projectEditor.hasAccessCode ? <button className="adm-archive-code-clear" type="button" disabled={!canWrite || codeBusy} onClick={() => void removeAccessCode(projectEditor.id)}>Cabut kode akses</button> : null}
        {codeError ? <p className="adp-inline-error" role="alert">{codeError}</p> : null}
        {codeFeedback ? <p className="adp-inline-success" role="status">{codeFeedback}</p> : null}
        <small>Kode disimpan sebagai sidik jari, bukan teks aslinya — sekali dipasang, ia tidak bisa dilihat lagi, hanya diganti. Berlaku juga untuk dokumen privat di dalam project ini. Tersimpan langsung, tanpa menunggu tombol simpan.</small>
      </div>
      <div className="adm-field"><label htmlFor="project-description">Deskripsi project</label><textarea id="project-description" disabled={!canWrite} rows={4} maxLength={500} value={projectEditor.description} onChange={(event) => updateProject(projectEditor.id, { description: event.target.value })} /></div>
    </AdminDrawer> : null}

    {documentEditor && documentEditorProject ? <AdminDrawer title={documentEditor.title || 'Dokumen baru'} isDirty={false} onClose={() => openEditor(null)} footer={<><button className="adm-btn adm-btn--danger" type="button" disabled={!canWrite} onClick={() => setDeleteTarget({ kind: 'document', projectId: documentEditorProject.id, document: documentEditor })}>Hapus dokumen</button><button className="adm-btn" type="button" onClick={() => openEditor(null)}>Selesai</button></>}>
      <p className="adp-hint-text">Tersimpan di project <strong>{documentEditorProject.title || 'Project baru'}</strong>.</p>
      {editorIssues.length > 0 ? <div className="adp-inline-error" role="alert">{editorIssues.map((issue) => <p key={issue.field}>{issue.message}</p>)}</div> : null}
      <div className="adm-field"><label htmlFor="document-title">Judul dokumen</label><input id="document-title" disabled={!canWrite} maxLength={180} value={documentEditor.title} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { title: event.target.value })} /></div>
      <div className="adm-field"><label htmlFor="document-format">Format</label><input id="document-format" disabled={!canWrite} maxLength={12} value={documentEditor.format} placeholder="PDF, DOCX, ZIP, ..." onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { format: event.target.value })} /></div>
      <div className="adm-field"><label htmlFor="document-status">Status</label><select id="document-status" disabled={!canWrite} value={documentEditor.status} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { status: event.target.value as DownloadStatus })}>{Object.entries(documentStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <div className="adm-field"><label htmlFor="document-kind">Sumber berkas</label><select id="document-kind" disabled={!canWrite} value={documentEditor.kind} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { kind: event.target.value as DownloadKind })}>{Object.entries(kindLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
      <div className="adm-field"><label htmlFor="document-visibility">Sifat dokumen</label><select id="document-visibility" disabled={!canWrite || documentEditorProject.visibility === 'private'} value={resolveDocumentVisibility(documentEditorProject, documentEditor)} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { visibility: event.target.value as DownloadVisibility })}><option value="public">Publik — bisa diunduh siapa pun</option><option value="private">Privat — butuh kode akses project</option></select><small>{documentEditorProject.visibility === 'private' ? 'Seluruh isi project ini sudah privat, jadi pilihannya terkunci di privat.' : 'Judul dokumen privat tetap terlihat di halaman publik; yang disembunyikan alamat berkasnya.'}</small></div>

      {documentEditor.kind === 'file' ? (() => {
        const isPrivate = resolveDocumentVisibility(documentEditorProject, documentEditor) === 'private'
        return <div className="adm-field"><label htmlFor="document-path">Jalur berkas</label><input id="document-path" disabled={!canWrite} value={documentEditor.path} placeholder={isPrivate ? `${DOWNLOADS_PRIVATE_DIR}/nama-berkas.pdf` : `${DOWNLOADS_PUBLIC_DIR}/nama-berkas.pdf`} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { path: event.target.value })} /><small>{isPrivate ? `Relatif ke akar repo dan wajib di ${DOWNLOADS_PRIVATE_DIR}/. Berkas privat sengaja tinggal di luar public/ supaya tidak punya alamat statis yang bisa ditebak.` : `Relatif ke public/ dan wajib berada di ${DOWNLOADS_PUBLIC_DIR}/.`}</small></div>
      })()
        : <div className="adm-field"><label htmlFor="document-url">Tautan eksternal</label><input id="document-url" disabled={!canWrite} value={documentEditor.externalUrl} placeholder="https://drive.google.com/..." onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { externalUrl: event.target.value })} /><small>{resolveDocumentVisibility(documentEditorProject, documentEditor) === 'private' ? 'Wajib HTTPS. Tautan privat diteruskan lewat server, jadi alamat aslinya tidak pernah sampai ke pengunjung — tetapi pastikan tautannya sendiri tidak dibagikan di tempat lain.' : 'Wajib memakai HTTPS.'}</small></div>}
      <div className="adm-field"><label htmlFor="document-description">Keterangan</label><textarea id="document-description" disabled={!canWrite} rows={4} maxLength={500} value={documentEditor.description} onChange={(event) => updateDocument(documentEditorProject.id, documentEditor.id, { description: event.target.value })} /></div>
    </AdminDrawer> : null}

    {deleteTarget ? <AdminConfirmDialog title={deleteTarget.kind === 'project' ? 'Hapus project beserta seluruh dokumen?' : 'Hapus dokumen dari project?'} body={deleteTarget.kind === 'project' ? `“${deleteTarget.project.title || 'Project baru'}” dan ${deleteTarget.project.documents.length} dokumen di dalamnya akan dikeluarkan dari pusat arsip setelah disimpan.` : `“${deleteTarget.document.title || 'Dokumen baru'}” akan dikeluarkan dari project setelah disimpan.`} confirmLabel="Ya, hapus" onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} /> : null}
  </AdminShell>
}
