import { cache } from 'react'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument } from '@/lib/firebase/content-services'
import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from '@/lib/site-settings'
import type { SiteSettingsDocument } from '@/types/firestore'

/**
 * Id dokumen tunggal tempat pengaturan situs tinggal.
 *
 * Satu dokumen, bukan satu dokumen per field. Seluruh isinya dibaca bersamaan
 * di setiap halaman, jadi memecahnya cuma menambah operasi baca berbayar tanpa
 * menambah keleluasaan apa pun.
 */
export const SITE_SETTINGS_ID = 'site'

/**
 * Pengaturan situs untuk halaman publik.
 *
 * Selalu berhasil. Firestore yang mati, rules yang belum disebar, atau dokumen
 * yang belum pernah dibuat semuanya jatuh ke nilai bawaan, karena kaki halaman
 * yang menampilkan nama kabinet lama jauh lebih baik daripada seluruh situs
 * yang gagal dirender gara-gara satu baris teks.
 */
export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasFirebaseConfig()) {
    return defaultSiteSettings
  }

  try {
    const document = await getContentDocument<SiteSettingsDocument>('settings', SITE_SETTINGS_ID)
    return normalizeSiteSettings(document as Record<string, unknown> | null)
  } catch (error) {
    console.warn('[site-settings] Gagal membaca settings/site, memakai nilai bawaan.', error)
    return defaultSiteSettings
  }
})
