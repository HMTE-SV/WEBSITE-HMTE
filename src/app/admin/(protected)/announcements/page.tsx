import type { Metadata } from 'next'
import { AdminContentListPage } from '@/components/admin/AdminContentListPage'

export const metadata: Metadata = {
  title: 'Admin Pengumuman HMTE',
  description: 'Kelola pengumuman website HMTE.',
}

export default function AdminAnnouncementsPage() {
  return <AdminContentListPage kind="announcements" />
}
