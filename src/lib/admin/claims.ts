import { isAdminRole, type AdminRole } from '@/types/admin'

/*
 * Bentuk custom claims yang ditempelkan ke akun admin.
 *
 * Kenapa claims dan bukan dokumen Firestore: sebelumnya tiap pemeriksaan izin
 * di firestore.rules memanggil `get()` ke `adminUsers/{uid}`. Itu berarti dua
 * hal buruk sekaligus. Editor baru tidak bisa masuk sampai ada yang membuatkan
 * dokumennya dengan tangan, dan tiap `get()` di rules adalah satu operasi baca
 * berbayar yang terjadi pada setiap tulis. Claims ikut di dalam token, jadi
 * rules membacanya tanpa menyentuh basis data sama sekali.
 *
 * Yang perlu diingat: claims baru sampai ke klien setelah tokennya disegarkan.
 * Karena itu AdminAuthGuard memaksa `getIdToken(true)` saat sesi dimulai.
 */

export type AdminClaims = {
  role?: AdminRole
  divisionCode?: string
}

export type AdminClaimsInput = {
  role: AdminRole
  divisionCode?: string | null
  active: boolean
}

/**
 * Menerjemahkan status akun jadi claims.
 *
 * Akun nonaktif tidak mendapat `role` sama sekali, bukan mendapat role dengan
 * penanda mati. Rules jadi cukup bertanya "punya role yang dikenal?" tanpa
 * perlu memeriksa bendera kedua yang bisa terlupa di salah satu cabang.
 *
 * Superadmin tidak membawa `divisionCode`. Ia tidak terikat bidang, dan
 * menyimpan bidang di sana akan membuatnya kelihatan terbatas padahal tidak.
 */
export function buildAdminClaims(input: AdminClaimsInput): AdminClaims {
  if (!input.active) {
    return {}
  }

  if (input.role !== 'editor') {
    return { role: input.role }
  }

  const divisionCode = (input.divisionCode || '').trim()

  return divisionCode ? { role: 'editor', divisionCode } : { role: 'editor' }
}

export type ResolvedAdminClaims = {
  role: AdminRole | null
  divisionCode: string
}

/** Membaca claims dari payload token yang sudah diverifikasi tanda tangannya. */
export function readAdminClaims(token: Record<string, unknown>): ResolvedAdminClaims {
  const role = token.role

  return {
    role: isAdminRole(role) ? role : null,
    divisionCode: typeof token.divisionCode === 'string' ? token.divisionCode : '',
  }
}

/**
 * Apakah claims yang tersimpan sudah sama dengan yang seharusnya.
 *
 * Menyetel claims memaksa penyegaran token pengguna, jadi menyetel ulang nilai
 * yang sudah benar bukan sekadar sia-sia: ia mengganggu sesi yang sedang jalan.
 */
export function claimsAreEqual(current: AdminClaims, next: AdminClaims) {
  return (current.role || '') === (next.role || '')
    && (current.divisionCode || '') === (next.divisionCode || '')
}
