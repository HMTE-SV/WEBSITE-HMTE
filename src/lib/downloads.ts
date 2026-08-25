/*
 * Model arsip HMTE yang dipakai bersama oleh panel admin, halaman publik,
 * dan lapisan server. Satu project mewakili satu kegiatan/folder; dokumen
 * terkait hidup di dalamnya supaya pengurus tidak mengelola daftar lepas.
 */

export const DOWNLOADS_ID = 'index'
export const DOWNLOADS_PUBLIC_DIR = 'assets/unduhan'

/*
 * Dua tempat penyimpanan, bukan satu.
 *
 * `downloads/index` terbaca publik karena halaman dirender server memakai SDK
 * klien tanpa sesi — Firestore tidak bisa membedakan pembaca server dari
 * pembaca browser, jadi apa pun yang ada di sana dianggap sudah terbit.
 * Karena itu arsip privat TIDAK boleh tinggal di sana, bahkan judulnya.
 *
 * `downloadsPrivate/index` adalah dokumen induk: isinya lengkap, terbaca hanya
 * oleh akun admin, dan di sisi publik hanya dapat dibaca lewat Admin SDK
 * setelah kode akses diverifikasi. `downloads/index` adalah salinan cermin yang
 * sudah disaring lewat redactDownloadsIndexForPublic().
 */
export const DOWNLOADS_PRIVATE_ID = 'index'

/**
 * Berkas arsip privat hidup di luar public/ supaya tidak pernah dilayani
 * sebagai aset statis. Satu-satunya jalan keluarnya adalah rute berkas yang
 * memeriksa kuki kode akses lebih dahulu.
 */
export const DOWNLOADS_PRIVATE_DIR = 'private/arsip'

export type DownloadKind = 'file' | 'external'
export type DownloadStatus = 'ready' | 'pending' | 'hidden'
export type DownloadProjectType = 'archive' | 'template'
export type DownloadProjectStatus = 'published' | 'hidden'
export type DownloadVisibility = 'public' | 'private'

const downloadKinds: DownloadKind[] = ['file', 'external']
const downloadStatuses: DownloadStatus[] = ['ready', 'pending', 'hidden']
const projectTypes: DownloadProjectType[] = ['archive', 'template']
const projectStatuses: DownloadProjectStatus[] = ['published', 'hidden']
const visibilities: DownloadVisibility[] = ['public', 'private']

export type DownloadDocument = {
  id: string
  title: string
  description: string
  kind: DownloadKind
  path: string
  externalUrl: string
  format: string
  status: DownloadStatus
  order: number
  /**
   * Dokumen privat di dalam project publik: judul dan keterangannya tetap
   * terlihat, tetapi alamat berkasnya tidak pernah ikut ke salinan publik.
   * Yang membukanya adalah kode akses milik project induknya.
   */
  visibility: DownloadVisibility
}

export type DownloadProject = {
  id: string
  title: string
  description: string
  /** Archive untuk dokumen kegiatan yang sudah dibuat; template untuk berkas pakai ulang. */
  type: DownloadProjectType
  /** Label periode bebas, mis. 2026, 2026/2027, atau Angkatan 2025. */
  period: string
  status: DownloadProjectStatus
  order: number
  /**
   * Project privat tidak pernah muncul di salinan publik, termasuk judulnya.
   * Pengunjung hanya melihat jumlahnya sebagai "arsip terbatas".
   */
  visibility: DownloadVisibility
  /**
   * Penanda bahwa kode aksesnya sudah dipasang. Nilainya bukan rahasia — kode
   * dan sidik jarinya tersimpan di `archiveAccess/{projectId}` yang tidak
   * terbaca siapa pun kecuali lewat Admin SDK.
   */
  hasAccessCode: boolean
  documents: DownloadDocument[]
}

/** Bentuk lama, hanya untuk migrasi dokumen `downloads/index` yang sudah tersimpan. */
type LegacyDownloadItem = DownloadDocument & {
  group?: string
  category?: 'brand' | 'dokumen' | 'template' | 'lainnya'
}

/** Berapa project terkunci yang ada per jenis, tanpa menyebut satu pun namanya. */
export type LockedProjectCounts = Record<DownloadProjectType, number>

export type DownloadsIndex = {
  projects: DownloadProject[]
  /**
   * Hanya terisi pada salinan publik. Di dokumen induk nilainya nol karena di
   * sana project privat memang hadir utuh.
   */
  lockedProjects: LockedProjectCounts
  updatedBy: string
}

export const defaultDownloadsIndex: DownloadsIndex = {
  projects: [],
  lockedProjects: { archive: 0, template: 0 },
  updatedBy: '',
}

export type DownloadsValidationIssue = {
  projectId: string
  documentId?: string
  field: string
  message: string
}

function pickText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function pickNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === 'string' && (allowed as string[]).includes(value) ? value as T : fallback
}

function isSafeRelativePath(path: string, root: string): boolean {
  if (typeof path !== 'string' || path.length === 0 || path.includes('..')) return false
  if (path.startsWith('/') || path.includes(':')) return false
  const normalized = path.replace(/\\/g, '/')
  return normalized.startsWith(`${root}/`) && normalized.length > `${root}/`.length
}

export function isSafeDownloadPath(path: string): boolean {
  return isSafeRelativePath(path, DOWNLOADS_PUBLIC_DIR)
}

/** Jalur berkas privat: relatif ke akar repo dan wajib di dalam private/arsip/. */
export function isSafePrivateDownloadPath(path: string): boolean {
  return isSafeRelativePath(path, DOWNLOADS_PRIVATE_DIR)
}

/**
 * Dokumen ikut terkunci kalau project induknya terkunci.
 *
 * Diputuskan di satu tempat supaya tidak ada lapisan yang lupa memeriksa salah
 * satu sisi — dokumen "publik" di dalam project privat tetap rahasia.
 */
export function resolveDocumentVisibility(
  project: Pick<DownloadProject, 'visibility'>,
  document: Pick<DownloadDocument, 'visibility'>,
): DownloadVisibility {
  return project.visibility === 'private' || document.visibility === 'private' ? 'private' : 'public'
}

function normalizeDocument(raw: unknown, index: number): DownloadDocument | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = pickText(record.id)
  const title = pickText(record.title)
  if (!id || !title) return null

  return {
    id,
    title,
    description: pickText(record.description),
    kind: pickEnum(record.kind, downloadKinds, 'file'),
    path: pickText(record.path),
    externalUrl: pickText(record.externalUrl),
    format: pickText(record.format),
    status: pickEnum(record.status, downloadStatuses, 'pending'),
    order: pickNumber(record.order, index),
    visibility: pickEnum(record.visibility, visibilities, 'public'),
  }
}

function normalizeProject(raw: unknown, index: number): DownloadProject | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = pickText(record.id)
  const title = pickText(record.title)
  if (!id || !title) return null

  const rawDocuments = Array.isArray(record.documents)
    ? record.documents
    : Array.isArray(record.items) ? record.items : []

  return {
    id,
    title,
    description: pickText(record.description),
    type: pickEnum(record.type, projectTypes, 'archive'),
    period: pickText(record.period),
    status: pickEnum(record.status, projectStatuses, 'hidden'),
    order: pickNumber(record.order, index),
    visibility: pickEnum(record.visibility, visibilities, 'public'),
    hasAccessCode: record.hasAccessCode === true,
    documents: rawDocuments
      .map(normalizeDocument)
      .filter((document): document is DownloadDocument => document !== null)
      .sort((first, second) => first.order - second.order),
  }
}

function legacyProjectId(type: DownloadProjectType, group: string, index: number) {
  const slug = group.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  return `legacy-${type}-${slug || index + 1}`
}

/** Mengubah daftar item lama menjadi folder tanpa menghilangkan satu berkas pun. */
function migrateLegacyItems(rawItems: unknown[]): DownloadProject[] {
  const grouped = new Map<string, { title: string; type: DownloadProjectType; documents: DownloadDocument[] }>()

  rawItems.forEach((raw, index) => {
    const document = normalizeDocument(raw, index)
    if (!document || !raw || typeof raw !== 'object') return
    const legacy = raw as LegacyDownloadItem
    const title = pickText(legacy.group, 'Umum')
    const type: DownloadProjectType = legacy.category === 'template' ? 'template' : 'archive'
    const key = `${type}:${title.toLowerCase()}`
    const current = grouped.get(key) ?? { title, type, documents: [] }
    current.documents.push({ ...document, order: current.documents.length })
    grouped.set(key, current)
  })

  return Array.from(grouped.values()).map((group, index) => ({
    id: legacyProjectId(group.type, group.title, index),
    title: group.title,
    description: '',
    type: group.type,
    period: '',
    status: group.documents.some((document) => document.status !== 'hidden') ? 'published' : 'hidden',
    order: index,
    visibility: 'public',
    hasAccessCode: false,
    documents: group.documents,
  }))
}

function pickLockedCounts(raw: unknown): LockedProjectCounts {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    archive: Math.max(0, Math.trunc(pickNumber(record.archive, 0))),
    template: Math.max(0, Math.trunc(pickNumber(record.template, 0))),
  }
}

export function normalizeDownloadsIndex(raw: unknown): DownloadsIndex {
  if (!raw || typeof raw !== 'object') return defaultDownloadsIndex
  const record = raw as Record<string, unknown>

  const projects = Array.isArray(record.projects)
    ? record.projects
        .map(normalizeProject)
        .filter((project): project is DownloadProject => project !== null)
        .sort((first, second) => first.order - second.order)
    : Array.isArray(record.items) ? migrateLegacyItems(record.items) : []

  return {
    projects,
    lockedProjects: pickLockedCounts(record.lockedProjects),
    updatedBy: pickText(record.updatedBy),
  }
}

/**
 * Menyusun salinan yang aman dibaca siapa pun dari dokumen induk.
 *
 * Ini satu-satunya tempat yang boleh memutuskan apa yang keluar ke dokumen
 * publik. Aturannya sengaja tumpul supaya tidak ada bidang baru yang lolos
 * diam-diam: project privat dibuang seluruhnya dan hanya disisakan hitungannya,
 * sedangkan dokumen privat di project publik dipertahankan judulnya tetapi
 * alamat berkasnya dikosongkan.
 *
 * Fungsi murni, dan diuji — panel admin yang memanggilnya berjalan di browser,
 * jadi kebenarannya tidak boleh bergantung pada apa pun di sekitarnya.
 */
export function redactDownloadsIndexForPublic(index: DownloadsIndex): DownloadsIndex {
  const lockedProjects: LockedProjectCounts = { archive: 0, template: 0 }

  const projects = index.projects.flatMap((project) => {
    if (project.visibility === 'private') {
      // Project tersembunyi tidak dihitung: ia memang belum untuk dilihat,
      // bahkan sebagai angka.
      if (project.status === 'published') lockedProjects[project.type] += 1
      return []
    }

    return [{
      ...project,
      documents: project.documents.map((document) => document.visibility === 'private'
        ? { ...document, path: '', externalUrl: '' }
        : document),
    }]
  })

  return { projects, lockedProjects, updatedBy: index.updatedBy }
}

export function makeDownloadProjectId(): string {
  return `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeDownloadDocumentId(): string {
  return `document-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`

  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(1).replace('.', ',')} ${units[unitIndex]}`
}

export function validateDownloadProjects(projects: DownloadProject[]): DownloadsValidationIssue[] {
  const issues: DownloadsValidationIssue[] = []

  projects.forEach((project) => {
    if (!project.title.trim()) {
      issues.push({ projectId: project.id, field: 'title', message: 'Nama project tidak boleh kosong.' })
    }
    if (project.status === 'published' && project.documents.length === 0) {
      issues.push({ projectId: project.id, field: 'documents', message: 'Project terbit harus memiliki sedikitnya satu dokumen.' })
    }

    /*
     * Sesuatu yang terkunci tanpa kode bukan terkunci, melainkan hilang: tidak
     * tampil di halaman publik dan tidak ada cara membukanya. Karena itu kode
     * akses diwajibkan begitu ada satu saja isi privat yang sudah terbit.
     */
    const hasPrivateContent = project.visibility === 'private'
      || project.documents.some((document) => document.visibility === 'private' && document.status !== 'hidden')
    if (project.status === 'published' && hasPrivateContent && !project.hasAccessCode) {
      issues.push({ projectId: project.id, field: 'accessCode', message: 'Isi privat butuh kode akses. Pasang kodenya sebelum project diterbitkan.' })
    }

    project.documents.forEach((document) => {
      const base = { projectId: project.id, documentId: document.id }
      const visibility = resolveDocumentVisibility(project, document)
      if (!document.title.trim()) issues.push({ ...base, field: 'title', message: 'Judul dokumen tidak boleh kosong.' })
      if (!document.format.trim()) issues.push({ ...base, field: 'format', message: 'Format dokumen tidak boleh kosong.' })
      if (document.kind === 'file' && visibility === 'public' && !isSafeDownloadPath(document.path)) {
        issues.push({ ...base, field: 'path', message: `Jalur berkas publik wajib berada di ${DOWNLOADS_PUBLIC_DIR}/.` })
      }
      if (document.kind === 'file' && visibility === 'private' && !isSafePrivateDownloadPath(document.path)) {
        issues.push({ ...base, field: 'path', message: `Jalur berkas privat wajib berada di ${DOWNLOADS_PRIVATE_DIR}/, di luar public/.` })
      }
      if (document.kind === 'external' && !document.externalUrl.startsWith('https://')) {
        issues.push({ ...base, field: 'externalUrl', message: 'Tautan eksternal wajib berawalan https://.' })
      }
    })
  })

  return issues
}
