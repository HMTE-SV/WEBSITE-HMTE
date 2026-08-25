import 'server-only'

import { cache } from 'react'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument } from '@/lib/firebase/content-services'
import { getMasterDownloadsIndex } from '@/lib/archive-access-store'
import {
  DOWNLOADS_ID,
  DOWNLOADS_PRIVATE_DIR,
  DOWNLOADS_PUBLIC_DIR,
  defaultDownloadsIndex,
  formatFileSize,
  isSafeDownloadPath,
  isSafePrivateDownloadPath,
  normalizeDownloadsIndex,
  resolveDocumentVisibility,
  type DownloadDocument,
  type DownloadProject,
  type DownloadProjectType,
  type DownloadsIndex,
  type LockedProjectCounts,
} from '@/lib/downloads'
import type { DownloadsDocument } from '@/types/firestore'

export type ResolvedDownloadDocument = DownloadDocument & {
  available: boolean
  sizeLabel: string
  href: string
  /** Butuh kode akses. Judulnya boleh tampil, alamatnya tidak. */
  locked: boolean
}

export type ResolvedDownloadProject = Omit<DownloadProject, 'documents'> & {
  documents: ResolvedDownloadDocument[]
}

/** Isi privat yang sudah terbuka untuk sesi ini. */
export type UnlockedArchive = {
  projects: ResolvedDownloadProject[]
  /** Dokumen privat di dalam project publik, dikelompokkan per id project. */
  revealed: Record<string, ResolvedDownloadDocument[]>
}

const PUBLIC_DOWNLOADS_ROOT = path.resolve(process.cwd(), 'public', DOWNLOADS_PUBLIC_DIR)
/*
 * Segmennya ditulis harfiah, bukan dirangkai dari DOWNLOADS_PRIVATE_DIR.
 *
 * Penelusuran berkas Turbopack membaca kode ini secara statis: jalur yang
 * dirangkai dari variabel terbaca sebagai "bisa ke mana saja", dan seluruh
 * proyek ikut terseret ke dalam bundel serverless. Konstantanya tetap dipakai
 * untuk memvalidasi jalur; yang di bawah ini hanya penunjuk foldernya.
 */
const PRIVATE_DOWNLOADS_ROOT = path.join(process.cwd(), 'private', 'arsip')
const PRIVATE_PREFIX_LENGTH = `${DOWNLOADS_PRIVATE_DIR}/`.length

export const getDownloadsIndex = cache(async (): Promise<DownloadsIndex> => {
  if (!hasFirebaseConfig()) return defaultDownloadsIndex

  try {
    const document = await getContentDocument<DownloadsDocument>('downloads', DOWNLOADS_ID)
    return normalizeDownloadsIndex(document as Record<string, unknown> | null)
  } catch (error) {
    console.warn('[downloads] Gagal membaca downloads/index, memakai daftar kosong.', error)
    return defaultDownloadsIndex
  }
})

function isWithin(root: string, absolutePath: string): boolean {
  const resolved = path.resolve(absolutePath)
  return resolved === root || resolved.startsWith(`${root}${path.sep}`)
}

/**
 * Alamat berkas privat selalu lewat rute bergerbang, tidak pernah alamat
 * aslinya. Berlaku untuk berkas maupun tautan eksternal: tautan yang terlanjur
 * dibagikan apa adanya tetap hidup setelah kodenya dicabut, dan tidak ada yang
 * bisa menariknya kembali.
 */
export function privateDocumentHref(projectId: string, documentId: string): string {
  return `/api/arsip/berkas/${encodeURIComponent(projectId)}/${encodeURIComponent(documentId)}`
}

function unavailable(document: DownloadDocument, locked: boolean): ResolvedDownloadDocument {
  return {
    ...document,
    status: document.status === 'ready' ? 'pending' : document.status,
    available: false,
    sizeLabel: '—',
    href: '',
    locked,
  }
}

/** Ukuran berkas privat di luar public/, dipakai hanya setelah kode terbukti. */
export async function statPrivateDocument(document: DownloadDocument): Promise<{ absolutePath: string; size: number } | null> {
  if (document.kind !== 'file' || !isSafePrivateDownloadPath(document.path)) return null

  // Dipotong prefiksnya lalu disambung ke akar yang sudah pasti, supaya jalur
  // yang dirangkai tidak pernah bisa menunjuk keluar folder arsip privat.
  const relative = document.path.split('\\').join('/').slice(PRIVATE_PREFIX_LENGTH)
  const absolutePath = path.join(PRIVATE_DOWNLOADS_ROOT, relative)
  if (!isWithin(PRIVATE_DOWNLOADS_ROOT, absolutePath)) return null

  try {
    const stats = await stat(absolutePath)
    return stats.isFile() ? { absolutePath, size: stats.size } : null
  } catch {
    return null
  }
}

async function resolvePublicDocument(document: DownloadDocument): Promise<ResolvedDownloadDocument> {
  if (document.kind === 'external') {
    return { ...document, available: true, sizeLabel: '—', href: document.externalUrl, locked: false }
  }

  if (!isSafeDownloadPath(document.path)) return unavailable(document, false)

  const absolutePath = path.join(process.cwd(), 'public', document.path)
  if (!isWithin(PUBLIC_DOWNLOADS_ROOT, absolutePath)) return unavailable(document, false)

  try {
    const stats = await stat(absolutePath)
    return { ...document, available: true, sizeLabel: formatFileSize(stats.size), href: `/${document.path}`, locked: false }
  } catch {
    return unavailable(document, false)
  }
}

async function resolvePrivateDocument(projectId: string, document: DownloadDocument): Promise<ResolvedDownloadDocument> {
  const href = privateDocumentHref(projectId, document.id)

  if (document.kind === 'external') {
    return { ...document, externalUrl: '', available: Boolean(document.externalUrl), sizeLabel: '—', href, locked: true }
  }

  const stats = await statPrivateDocument(document)
  if (!stats) return unavailable({ ...document, path: '' }, true)

  return { ...document, path: '', available: true, sizeLabel: formatFileSize(stats.size), href, locked: true }
}

function visibleDocuments(project: DownloadProject): DownloadDocument[] {
  return project.documents
    .filter((document) => document.status !== 'hidden')
    .sort((first, second) => first.order - second.order)
}

/**
 * Isi yang aman dirender ke HTML statis.
 *
 * Dokumen privat tetap muncul sebagai baris terkunci — judulnya memang sudah
 * ada di salinan publik — tetapi tanpa alamat apa pun sampai kodenya masuk.
 */
export const getPublicDownloadProjects = cache(async (type: DownloadProjectType): Promise<ResolvedDownloadProject[]> => {
  const index = await getDownloadsIndex()
  const projects = index.projects
    .filter((project) => project.type === type && project.status === 'published' && project.visibility === 'public')
    .sort((first, second) => first.order - second.order)

  return Promise.all(projects.map(async (project) => ({
    ...project,
    documents: await Promise.all(visibleDocuments(project).map((document) => document.visibility === 'private'
      ? Promise.resolve(unavailable(document, true))
      : resolvePublicDocument(document))),
  })))
})

/** Berapa banyak arsip yang sepenuhnya terkunci, tanpa membocorkan namanya. */
export const getLockedProjectCounts = cache(async (): Promise<LockedProjectCounts> => {
  const index = await getDownloadsIndex()
  return index.lockedProjects
})

/**
 * Isi privat untuk sesi yang sudah membuktikan kodenya.
 *
 * Dibaca dari dokumen induk lewat Admin SDK, bukan dari salinan publik — di
 * sanalah satu-satunya tempat isi privat masih utuh.
 */
export async function getUnlockedArchive(unlockedProjectIds: string[], type: DownloadProjectType): Promise<UnlockedArchive> {
  const allowed = new Set(unlockedProjectIds)
  if (allowed.size === 0) return { projects: [], revealed: {} }

  const master = await getMasterDownloadsIndex()
  const projects: ResolvedDownloadProject[] = []
  const revealed: Record<string, ResolvedDownloadDocument[]> = {}

  const candidates = master.projects
    .filter((project) => project.type === type && project.status === 'published' && allowed.has(project.id))
    .sort((first, second) => first.order - second.order)

  for (const project of candidates) {
    const documents = await Promise.all(visibleDocuments(project).map((document) =>
      resolveDocumentVisibility(project, document) === 'private'
        ? resolvePrivateDocument(project.id, document)
        : resolvePublicDocument(document)))

    if (project.visibility === 'private') {
      projects.push({ ...project, documents })
      continue
    }

    const privateOnly = documents.filter((document) => document.locked)
    if (privateOnly.length > 0) revealed[project.id] = privateOnly
  }

  return { projects, revealed }
}

/**
 * Dokumen yang hendak dialirkan rute berkas.
 *
 * Sengaja mengembalikan bentuk mentah, bukan yang sudah diredaksi: rute perlu
 * alamat aslinya, dan hanya rute itu yang boleh melihatnya.
 */
export async function findPrivateDocument(projectId: string, documentId: string): Promise<{ project: DownloadProject; document: DownloadDocument } | null> {
  const master = await getMasterDownloadsIndex()
  const project = master.projects.find((candidate) => candidate.id === projectId)
  if (!project || project.status !== 'published') return null

  const document = project.documents.find((candidate) => candidate.id === documentId)
  if (!document || document.status === 'hidden') return null
  if (resolveDocumentVisibility(project, document) !== 'private') return null

  return { project, document }
}
