import { cache } from 'react'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument } from '@/lib/firebase/content-services'
import { getDefaultPageContent, normalizePageContent, type PageContent, type PageKey } from '@/lib/page-content'
import type { PageContentDocument } from '@/types/firestore'

export const getPageContent = cache(async function getPageContent(pageKey: PageKey): Promise<PageContent> {
  if (!hasFirebaseConfig()) return getDefaultPageContent(pageKey)

  try {
    const document = await getContentDocument<PageContentDocument>('pageContents', pageKey)
    return normalizePageContent(document as Record<string, unknown> | null, pageKey)
  } catch (error) {
    console.warn(`[page-content] Gagal membaca pageContents/${pageKey}, memakai nilai bawaan.`, error)
    return getDefaultPageContent(pageKey)
  }
})
