import type { AdminRole } from '@/types/admin'

/** Modul panel yang dapat diberikan secara mandiri kepada akun non-superadmin. */
export const adminPermissionKeys = [
  'pages',
  'announcements',
  'articles',
  'publicData',
  'gallery',
  'media',
  'downloads',
  'leaders',
  'programs',
  'divisions',
  'aspirations',
  'history',
] as const

export type AdminPermission = (typeof adminPermissionKeys)[number]

export const adminPermissionDefinitions: ReadonlyArray<{
  key: AdminPermission
  label: string
  description: string
  group: 'Publikasi' | 'Organisasi' | 'Sistem'
}> = [
  { key: 'pages', label: 'Halaman Situs', description: 'Copy, susunan, dan tampilan halaman publik.', group: 'Publikasi' },
  { key: 'announcements', label: 'Pengumuman', description: 'Pengumuman publik dan status terbitnya.', group: 'Publikasi' },
  { key: 'articles', label: 'Berita', description: 'Artikel, cover, dan metadata berita.', group: 'Publikasi' },
  { key: 'publicData', label: 'Data Publik', description: 'Data mahasiswa, penugasan, dan resource terkait.', group: 'Publikasi' },
  { key: 'gallery', label: 'Galeri', description: 'Koleksi dokumentasi yang tampil ke publik.', group: 'Publikasi' },
  { key: 'media', label: 'Pustaka Media', description: 'Aset gambar yang dipakai oleh panel.', group: 'Publikasi' },
  { key: 'downloads', label: 'Pusat Arsip', description: 'Folder proyek, template, dan arsip dokumen.', group: 'Publikasi' },
  { key: 'leaders', label: 'Kepengurusan', description: 'Anggota dan kontak pada bidang yang ditugaskan.', group: 'Organisasi' },
  { key: 'programs', label: 'Program Kerja', description: 'Program pada bidang yang ditugaskan.', group: 'Organisasi' },
  { key: 'divisions', label: 'Divisi', description: 'Melihat struktur divisi; perubahan tetap khusus superadmin.', group: 'Organisasi' },
  { key: 'aspirations', label: 'Aspirasi', description: 'Pesan mahasiswa dan catatan tindak lanjut internal.', group: 'Organisasi' },
  { key: 'history', label: 'Riwayat Perubahan', description: 'Audit perubahan dan revisi konten.', group: 'Sistem' },
]

/** Operator baru hanya memegang dua area kerja dasar. Modul lain diberikan eksplisit. */
export const defaultEditorPermissions: readonly AdminPermission[] = ['media', 'programs']

/** Viewer lama tetap dapat meninjau seluruh modul setelah migrasi claims. */
export const defaultViewerPermissions: readonly AdminPermission[] = adminPermissionKeys

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string' && (adminPermissionKeys as readonly string[]).includes(value)
}

export function normalizeAdminPermissions(
  role: AdminRole,
  value: unknown,
): AdminPermission[] {
  if (role === 'superadmin') return [...adminPermissionKeys]

  const fallback = role === 'editor' ? defaultEditorPermissions : defaultViewerPermissions
  const requested = Array.isArray(value) ? value : fallback
  const selected = new Set(requested.filter(isAdminPermission))
  return adminPermissionKeys.filter((permission) => selected.has(permission))
}

export function hasAdminPermission(
  subject: { role: AdminRole; permissions?: readonly AdminPermission[] },
  permission: AdminPermission,
) {
  return subject.role === 'superadmin' || Boolean(subject.permissions?.includes(permission))
}
