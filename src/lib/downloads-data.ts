import 'server-only'

import { cache } from 'react'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument } from '@/lib/firebase/content-services'
import {
  DOWNLOADS_ID,
  DOWNLOADS_PUBLIC_DIR,
  defaultDownloadsIndex,
  formatFileSize,
  isSafeDownloadPath,
  normalizeDownloadsIndex,
  type DownloadDocument,
  type DownloadProject,
  type DownloadProjectType,
  type DownloadsIndex,
} from '@/lib/downloads'
import type { DownloadsDocument } from '@/types/firestore'

export type ResolvedDownloadDocument = DownloadDocument & {
  available: boolean
  sizeLabel: string
  href: string
}

export type ResolvedDownloadProject = Omit<DownloadProject, 'documents'> & {
  documents: ResolvedDownloadDocument[]
}

const PUBLIC_DOWNLOADS_ROOT = path.resolve(process.cwd(), 'public', DOWNLOADS_PUBLIC_DIR)

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

function isWithinDownloadsRoot(absolutePath: string): boolean {
  const resolved = path.resolve(absolutePath)
  return resolved === PUBLIC_DOWNLOADS_ROOT || resolved.startsWith(`${PUBLIC_DOWNLOADS_ROOT}${path.sep}`)
}

async function resolveDocument(document: DownloadDocument): Promise<ResolvedDownloadDocument> {
  if (document.kind === 'external') {
    return { ...document, available: true, sizeLabel: '—', href: document.externalUrl }
  }

  if (!isSafeDownloadPath(document.path)) {
    return { ...document, status: document.status === 'ready' ? 'pending' : document.status, available: false, sizeLabel: '—', href: '' }
  }

  const absolutePath = path.join(process.cwd(), 'public', document.path)
  if (!isWithinDownloadsRoot(absolutePath)) {
    return { ...document, status: document.status === 'ready' ? 'pending' : document.status, available: false, sizeLabel: '—', href: '' }
  }

  try {
    const stats = await stat(absolutePath)
    return { ...document, available: true, sizeLabel: formatFileSize(stats.size), href: `/${document.path}` }
  } catch {
    return { ...document, status: document.status === 'ready' ? 'pending' : document.status, available: false, sizeLabel: '—', href: '' }
  }
}

export const getPublicDownloadProjects = cache(async (type: DownloadProjectType): Promise<ResolvedDownloadProject[]> => {
  const index = await getDownloadsIndex()
  const projects = index.projects
    .filter((project) => project.type === type && project.status === 'published')
    .sort((first, second) => first.order - second.order)

  return Promise.all(projects.map(async (project) => ({
    ...project,
    documents: await Promise.all(
      project.documents
        .filter((document) => document.status !== 'hidden')
        .sort((first, second) => first.order - second.order)
        .map(resolveDocument),
    ),
  })))
})
