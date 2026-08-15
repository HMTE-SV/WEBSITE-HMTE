import type { AdminRole } from '@/types/admin'
import { hasAdminPermission, normalizeAdminPermissions, type AdminPermission } from '@/lib/admin/permissions'

export type AdminNavItem = {
  group: 'workspace' | 'publikasi' | 'organisasi' | 'sistem'
  href: string
  icon: AdminNavIcon
  label: string
  roles: readonly AdminRole[]
  permission?: AdminPermission
}

export type AdminNavIcon =
  | 'dashboard'
  | 'announcement'
  | 'calendar'
  | 'data'
  | 'article'
  | 'gallery'
  | 'history'
  | 'media'
  | 'page'
  | 'people'
  | 'program'
  | 'division'
  | 'inbox'
  | 'settings'

export const adminNavItems: readonly AdminNavItem[] = [
  {
    group: 'workspace',
    href: '/admin',
    icon: 'dashboard',
    label: 'Dashboard',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/pages',
    icon: 'page',
    label: 'Halaman Situs',
    permission: 'pages',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/announcements',
    icon: 'announcement',
    label: 'Pengumuman',
    permission: 'announcements',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/articles',
    icon: 'article',
    label: 'Berita',
    permission: 'articles',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/data',
    icon: 'data',
    label: 'Data Publik',
    permission: 'publicData',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/gallery',
    icon: 'gallery',
    label: 'Galeri',
    permission: 'gallery',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/media',
    icon: 'media',
    label: 'Pustaka Media',
    permission: 'media',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'publikasi',
    href: '/admin/downloads',
    icon: 'page',
    label: 'Pusat Arsip',
    permission: 'downloads',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/leaders',
    icon: 'people',
    label: 'Kepengurusan',
    permission: 'leaders',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/programs',
    icon: 'program',
    label: 'Program Kerja',
    permission: 'programs',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/divisions',
    icon: 'division',
    label: 'Divisi',
    permission: 'divisions',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'organisasi',
    href: '/admin/aspirations',
    icon: 'inbox',
    label: 'Aspirasi',
    permission: 'aspirations',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'sistem',
    href: '/admin/history',
    icon: 'history',
    label: 'Riwayat Perubahan',
    permission: 'history',
    roles: ['superadmin', 'editor', 'viewer'],
  },
  {
    group: 'sistem',
    href: '/admin/users',
    icon: 'people',
    label: 'Akun Admin',
    roles: ['superadmin'],
  },
  {
    group: 'sistem',
    href: '/admin/settings',
    icon: 'settings',
    label: 'Pengaturan',
    roles: ['superadmin'],
  },
]

export function getAdminNavItemsForRole(role: AdminRole, assignedPermissions?: readonly AdminPermission[]) {
  const permissions = assignedPermissions ?? normalizeAdminPermissions(role, undefined)
  return adminNavItems.filter((item) => (
    (item.roles as readonly AdminRole[]).includes(role)
    && (!item.permission || hasAdminPermission({ role, permissions }, item.permission))
  ))
}

export function canAdminWrite(role: AdminRole) {
  return role === 'superadmin' || role === 'editor'
}

export function canAccessAdminPath(
  role: AdminRole,
  pathname: string,
  assignedPermissions?: readonly AdminPermission[],
) {
  const permissions = assignedPermissions ?? normalizeAdminPermissions(role, undefined)
  const matchedItem = [...adminNavItems]
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`)))

  if (!matchedItem || !(matchedItem.roles as readonly AdminRole[]).includes(role)) {
    return false
  }

  if (matchedItem.permission && !hasAdminPermission({ role, permissions }, matchedItem.permission)) {
    return false
  }

  if (role !== 'viewer') {
    return true
  }

  return !/^\/admin\/(announcements|articles|data)\/[^/]+$/.test(pathname)
}
