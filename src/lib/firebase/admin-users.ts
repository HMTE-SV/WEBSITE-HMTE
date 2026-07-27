import { doc, getDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getFirebaseDb } from './client'
import { readAdminClaims } from '@/lib/admin/claims'
import { isAdminRole, type AdminUser } from '@/types/admin'

/*
 * Menyusun sesi admin dari akun yang sedang masuk.
 *
 * Jalur utamanya tidak menyentuh Firestore sama sekali. Role dan bidang ada di
 * custom claims, dan nama serta email ada di objek pengguna Firebase. Itu sudah
 * seluruh isi sesi. Inilah yang membuat editor baru cukup masuk, tanpa ada yang
 * perlu membuatkan dokumen `adminUsers` dengan tangan lebih dulu.
 *
 * Token disegarkan paksa sekali di awal sesi. Custom claims yang baru dipasang
 * tidak muncul di token lama sampai kedaluwarsa, dan tanpa penyegaran ini
 * seorang editor yang baru ditugaskan akan melihat panelnya tetap menolaknya
 * selama hampir satu jam tanpa sebab yang kelihatan.
 */

export async function getAdminSession(user: User): Promise<AdminUser | null> {
  const result = await user.getIdTokenResult(true)
  const { role, divisionCode } = readAdminClaims(result.claims as Record<string, unknown>)

  if (role) {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      role,
      divisionCode: divisionCode ? (divisionCode as AdminUser['divisionCode']) : undefined,
      active: true,
    }
  }

  // Jalur cadangan untuk akun lama yang dokumennya sudah ada tapi claims-nya
  // belum pernah disetel. Hanya untuk menampilkan panel; Firestore sendiri
  // tetap menolak tulisannya sampai `npm run sync:claims` dijalankan, dan
  // pesan di AdminAuthGuard yang menerangkan itu.
  return getLegacyAdminProfile(user.uid)
}

export async function getLegacyAdminProfile(uid: string): Promise<AdminUser | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), 'adminUsers', uid))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  if (!isAdminRole(data.role) || data.active !== true) {
    return null
  }

  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    role: data.role,
    divisionCode: typeof data.divisionCode === 'string' ? data.divisionCode as AdminUser['divisionCode'] : undefined,
    active: true,
    // Penanda bahwa wewenangnya belum benar-benar terpasang di token. Panel
    // memakainya untuk memperingatkan, bukan untuk memberi atau menahan izin.
    claimsPending: true,
  }
}
