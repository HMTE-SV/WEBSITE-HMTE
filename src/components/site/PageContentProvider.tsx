'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { getPageSection, pageField, type PageContent } from '@/lib/page-content'

const PageContentContext = createContext<PageContent | null>(null)

export function PageContentProvider({ children, content }: { children: ReactNode; content: PageContent }) {
  return <PageContentContext.Provider value={content}>{children}</PageContentContext.Provider>
}

export function usePageContent() {
  const content = useContext(PageContentContext)
  if (!content) throw new Error('Komponen halaman dipakai di luar PageContentProvider.')
  return content
}

export function usePageSection(sectionId: string) {
  return getPageSection(usePageContent(), sectionId)
}

export function usePageField(sectionId: string, fieldKey: string) {
  return pageField(usePageContent(), sectionId, fieldKey)
}
