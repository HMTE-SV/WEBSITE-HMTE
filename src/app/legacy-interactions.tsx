'use client'

import { useEffect } from 'react'
import type { ArticleCategoryKey, ArticleGroup, DivisionCode, Leader, Program } from '@/types/content'

type LegacyInteractionsProps = {
  script: string
  data: LegacyData
}

export type LegacyData = {
  newsData: Record<ArticleCategoryKey, ArticleGroup>
  kepData: Record<DivisionCode, Leader[]>
  prokerData: Record<DivisionCode, Program[]>
}

declare global {
  interface Window {
    __HMTE_LEGACY_DATA__?: LegacyData
  }
}

export function LegacyInteractions({ script, data }: LegacyInteractionsProps) {
  useEffect(() => {
    const originalAddEventListener = document.addEventListener.bind(document)

    window.__HMTE_LEGACY_DATA__ = data

    const patchedAddEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === 'DOMContentLoaded' && typeof listener === 'function') {
        window.setTimeout(() => listener(new Event('DOMContentLoaded')), 0)
        return
      }

      return originalAddEventListener(type, listener, options)
    }) as Document['addEventListener']

    document.addEventListener = patchedAddEventListener

    try {
      // Runs the preserved static-site script after Next has mounted the legacy HTML.
      new Function(script)()
    } finally {
      document.addEventListener = originalAddEventListener
    }
  }, [script, data])

  return null
}
