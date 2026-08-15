import 'server-only'

import { cache } from 'react'
import { sanitizeArticleContent } from '@/lib/article-content'
import { listPublishedPublicData } from '@/lib/firebase/content-services'
import {
  getPublicDataCategoryLabel,
  normalizePublicDataResources,
  type PublicDataCategory,
  type PublicDataResource,
} from '@/lib/public-data'
import type { PublicDataDocument } from '@/types/firestore'

export type PublicDataEntry = {
  id: string
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  category: PublicDataCategory
  categoryLabel: string
  period: string
  resources: PublicDataResource[]
  showDataMeta: boolean
  publishedLabel: string
  updatedIso: string
}

function timestampToDate(value: PublicDataDocument['updatedAt'] | PublicDataDocument['publishedAt']) {
  return value?.toDate() ?? null
}

function toPublicDataEntry(document: PublicDataDocument): PublicDataEntry {
  const updated = timestampToDate(document.updatedAt) ?? timestampToDate(document.publishedAt)
  return {
    id: document.id,
    title: document.title,
    slug: document.slug,
    excerpt: document.excerpt,
    contentHtml: sanitizeArticleContent(document.content),
    category: document.category,
    categoryLabel: getPublicDataCategoryLabel(document.category),
    period: document.period || '',
    resources: normalizePublicDataResources(document.resources),
    showDataMeta: document.showDataMeta !== false,
    publishedLabel: updated
      ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(updated)
      : 'Tanggal belum tersedia',
    updatedIso: updated?.toISOString() ?? '',
  }
}

export const getPublishedPublicData = cache(async () => {
  const documents = await listPublishedPublicData()
  return documents.map(toPublicDataEntry)
})

export const getPublishedPublicDataBySlug = cache(async (slug: string) => {
  const entries = await getPublishedPublicData()
  return entries.find((entry) => entry.slug === slug) ?? null
})
