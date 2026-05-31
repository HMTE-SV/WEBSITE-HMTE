export const adminRoles = ['superadmin', 'editor', 'viewer'] as const

export type AdminRole = (typeof adminRoles)[number]

export type AdminUser = {
  uid: string
  email: string
  displayName?: string | null
  role: AdminRole
  active: boolean
  createdAt?: unknown
  updatedAt?: unknown
}
