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
  active: boolean
  createdAt?: unknown
  updatedAt?: unknown
}
