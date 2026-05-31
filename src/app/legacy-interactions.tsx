'use client'

import { useEffect } from 'react'

type LegacyInteractionsProps = {
  script: string
}

export function LegacyInteractions({ script }: LegacyInteractionsProps) {
  useEffect(() => {
    const originalAddEventListener = document.addEventListener.bind(document)

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
  }, [script])

  return null
}
