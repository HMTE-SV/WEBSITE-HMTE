'use client'

import { useEffect } from 'react'

/*
 * Mendaftarkan public/sw.js (dibangun dari src/sw/sw.ts). Hanya di build
 * produksi: di `next dev` berkas itu tidak ada, dan SW yang menyimpan aset
 * lama akan membingungkan saat mengembangkan. Didaftarkan setelah `load`
 * supaya tidak berebut jaringan dengan muatan pertama halaman.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Gagal mendaftar (mis. mode privat yang memblokir SW) tidak boleh
        // mengganggu situs: tanpa SW, situs tetap berjalan seperti biasa.
      })
    }

    if (document.readyState === 'complete') {
      register()
      return
    }
    window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
