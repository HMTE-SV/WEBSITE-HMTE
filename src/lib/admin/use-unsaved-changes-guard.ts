'use client'

import { useEffect } from 'react'

const defaultMessage = 'Ada perubahan yang belum disimpan. Tinggalkan editor dan buang perubahan tersebut?'

/**
 * Menahan reload/close dan klik tautan internal saat form masih kotor.
 *
 * `beforeunload` menangani refresh, tutup tab, dan navigasi dokumen. Listener
 * click-capture menutup celah Next.js Link, karena perpindahan client-side tidak
 * selalu memicu `beforeunload`.
 */
export function useUnsavedChangesGuard(enabled: boolean, message = defaultMessage) {
  useEffect(() => {
    if (!enabled) return

    function preventUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    function confirmLinkNavigation(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLAnchorElement>('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)
      const current = new URL(window.location.href)
      if (destination.href === current.href || (destination.pathname === current.pathname && destination.search === current.search && destination.hash)) return
      if (window.confirm(message)) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }

    window.addEventListener('beforeunload', preventUnload)
    document.addEventListener('click', confirmLinkNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', preventUnload)
      document.removeEventListener('click', confirmLinkNavigation, true)
    }
  }, [enabled, message])
}
