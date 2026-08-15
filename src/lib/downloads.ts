/*
 * Model arsip HMTE yang dipakai bersama oleh panel admin, halaman publik,
 * dan lapisan server. Satu project mewakili satu kegiatan/folder; dokumen
 * terkait hidup di dalamnya supaya pengurus tidak mengelola daftar lepas.
 */

export const DOWNLOADS_ID = 'index'
export const DOWNLOADS_PUBLIC_DIR = 'assets/unduhan'

export type DownloadKind = 'file' | 'external'
export type DownloadStatus = 'ready' | 'pending' | 'hidden'
export type DownloadProjectType = 'archive' | 'template'
export type DownloadProjectStatus = 'published' | 'hidden'

const downloadKinds: DownloadKind[] = ['file', 'external']
const downloadStatuses: DownloadStatus[] = ['ready', 'pending', 'hidden']
const projectTypes: DownloadProjectType[] = ['archive', 'template']
const projectStatuses: DownloadProjectStatus[] = ['published', 'hidden']

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
  documents: DownloadDocument[]
}

/** Bentuk lama, hanya untuk migrasi dokumen `downloads/index` yang sudah tersimpan. */
type LegacyDownloadItem = DownloadDocument & {
  group?: string
  category?: 'brand' | 'dokumen' | 'template' | 'lainnya'
}

export type DownloadsIndex = {
  projects: DownloadProject[]
  updatedBy: string
}

export const defaultDownloadsIndex: DownloadsIndex = {
  projects: [],
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

export function isSafeDownloadPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0 || path.includes('..')) return false
  if (path.startsWith('/') || path.includes(':')) return false
  const normalized = path.replace(/\\/g, '/')
  return normalized.startsWith(`${DOWNLOADS_PUBLIC_DIR}/`) && normalized.length > `${DOWNLOADS_PUBLIC_DIR}/`.length
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
    documents: group.documents,
  }))
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

  return { projects, updatedBy: pickText(record.updatedBy) }
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

    project.documents.forEach((document) => {
      const base = { projectId: project.id, documentId: document.id }
      if (!document.title.trim()) issues.push({ ...base, field: 'title', message: 'Judul dokumen tidak boleh kosong.' })
      if (!document.format.trim()) issues.push({ ...base, field: 'format', message: 'Format dokumen tidak boleh kosong.' })
      if (document.kind === 'file' && !isSafeDownloadPath(document.path)) {
        issues.push({ ...base, field: 'path', message: 'Jalur berkas tidak sah.' })
      }
      if (document.kind === 'external' && !document.externalUrl.startsWith('https://')) {
        issues.push({ ...base, field: 'externalUrl', message: 'Tautan eksternal wajib berawalan https://.' })
      }
    })
  })

  return issues
}
