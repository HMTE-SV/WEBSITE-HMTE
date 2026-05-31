import type { AdminRole } from '@/types/admin'

export type AdminNavItem = {
  href: string
  label: string
  roles: readonly AdminRole[]
}

export const adminNavItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/announcements',
    label: 'Pengumuman',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/events',
    label: 'Agenda',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/articles',
    label: 'Berita',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/gallery',
    label: 'Galeri',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/leaders',
    label: 'Kepengurusan',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    roles: ['superadmin'],
  },
] as const satisfies readonly AdminNavItem[]

export function getAdminNavItemsForRole(role: AdminRole) {
  return adminNavItems.filter((item) => (item.roles as readonly AdminRole[]).includes(role))
}
