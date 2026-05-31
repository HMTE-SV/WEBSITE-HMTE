import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Tambah Pengumuman HMTE',
  description: 'Tambah pengumuman website HMTE.',
}

export default function NewAnnouncementPage() {
  return <AdminContentFormPage kind="announcements" />
}
