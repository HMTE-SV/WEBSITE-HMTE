import type { DivisionCode } from './content'
import type { AdminPermission } from '@/lib/admin/permissions'

export const adminRoles = ['superadmin', 'editor', 'viewer'] as const

export type AdminRole = (typeof adminRoles)[number]

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && (adminRoles as readonly string[]).includes(value)
}

export type AdminUser = {
  uid: string
  email: string
  displayName?: string | null
  role: AdminRole
  /**
   * Bidang yang boleh disentuh akun ini. Wajib untuk editor, tidak dipakai
   * superadmin. Editor tanpa bidang tidak bisa mengubah data pengurus maupun
   * program mana pun, dan itu memang perilaku yang diinginkan: lebih baik
   * terkunci sampai ditugaskan daripada terbuka ke semua bidang.
   */
  divisionCode?: DivisionCode
  /** Modul panel yang boleh dibuka. Superadmin selalu memiliki semuanya. */
  permissions: AdminPermission[]
  active: boolean
  /**
   * Sesi ini disusun dari dokumen `adminUsers`, bukan dari custom claims.
   *
   * Artinya panel akan menampilkan menunya, tapi Firestore akan menolak setiap
   * tulisan, karena rules hanya membaca claims. Keadaan sementara untuk akun
   * yang belum dilewati `npm run sync:claims`.
   */
  claimsPending?: boolean
  createdAt?: unknown
  updatedAt?: unknown
}
