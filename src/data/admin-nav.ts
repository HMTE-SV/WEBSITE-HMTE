import type { AdminRole } from '@/types/admin'

export type AdminNavItem = {
  group: 'workspace' | 'publikasi' | 'organisasi' | 'sistem'
  href: string
  icon: AdminNavIcon
  label: string
  roles: readonly AdminRole[]
}

export type AdminNavIcon = 'dashboard' | 'announcement' | 'calendar' | 'article' | 'gallery' | 'people' | 'inbox' | 'settings'

export const adminNavItems = [
  {
    group: 'workspace',
    href: '/admin',
    icon: 'dashboard',
    label: 'Dashboard',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/announcements',
    icon: 'announcement',
    label: 'Pengumuman',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/events',
    icon: 'calendar',
    label: 'Agenda',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/articles',
    icon: 'article',
    label: 'Berita',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/gallery',
    icon: 'gallery',
    label: 'Galeri',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/leaders',
    icon: 'people',
    label: 'Kepengurusan',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/aspirations',
    icon: 'inbox',
    label: 'Aspirasi',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'sistem',
    href: '/admin/settings',
    icon: 'settings',
    label: 'Pengaturan',
    roles: ['superadmin'],
  },
] as const satisfies readonly AdminNavItem[]

export function getAdminNavItemsForRole(role: AdminRole) {
  return adminNavItems.filter((item) => (item.roles as readonly AdminRole[]).includes(role))
}

export function canAdminWrite(role: AdminRole) {
  return role === 'superadmin' || role === 'editor'
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  const matchedItem = [...adminNavItems]
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`)))

  if (!matchedItem || !(matchedItem.roles as readonly AdminRole[]).includes(role)) {
    return false
  }

  if (role !== 'viewer') {
    return true
  }

  return !/^\/admin\/(announcements|events|articles)\/[^/]+$/.test(pathname)
}
