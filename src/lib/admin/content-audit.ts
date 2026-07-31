import type {
  AuditAction,
  AuditSnapshot,
  AuditedContentCollectionName,
} from '@/types/firestore'

const systemFields = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt'])

function normalizeValue(value: unknown): unknown {
  if (value === undefined) return undefined
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) return value.toISOString()

  if (Array.isArray(value)) {
    return value.map(normalizeValue).filter((item) => item !== undefined)
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date }
    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().toISOString()
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !systemFields.has(key))
        .map(([key, nested]) => [key, normalizeValue(nested)])
        .filter(([, nested]) => nested !== undefined),
    )
  }

  return String(value)
}

/** Snapshot revision hanya berisi data editorial, tanpa id dan timestamp sistem. */
export function toAuditSnapshot(value: Record<string, unknown> | null | undefined): AuditSnapshot | null {
  if (!value) return null
  return normalizeValue(value) as AuditSnapshot
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableValue(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function getChangedFields(before: AuditSnapshot | null, after: AuditSnapshot | null) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  return [...keys]
    .filter((key) => stableValue(before?.[key]) !== stableValue(after?.[key]))
    .sort((first, second) => first.localeCompare(second))
}

const collectionLabels: Record<AuditedContentCollectionName, string> = {
  announcements: 'pengumuman',
  articles: 'berita',
  divisions: 'divisi',
  gallery: 'galeri',
  leaders: 'pengurus',
  media: 'media',
  mediaSlots: 'slot media',
  pageContents: 'halaman',
  pageContentDrafts: 'draf halaman',
  partners: 'mitra',
  programs: 'program kerja',
  settings: 'pengaturan',
  siteSettingsDrafts: 'draf pengaturan',
}

const actionLabels: Record<AuditAction, string> = {
  create: 'Membuat',
  update: 'Memperbarui',
  delete: 'Menghapus',
  restore: 'Memulihkan',
}

export function buildAuditSummary(
  action: AuditAction,
  entityType: AuditedContentCollectionName,
  entityId: string,
) {
  return `${actionLabels[action]} ${collectionLabels[entityType]} ${entityId}`
}

export function isAuditedContentCollection(
  value: string,
): value is AuditedContentCollectionName {
  return Object.hasOwn(collectionLabels, value)
}
