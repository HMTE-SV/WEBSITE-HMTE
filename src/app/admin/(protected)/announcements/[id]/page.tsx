import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Edit Pengumuman HMTE',
  description: 'Edit pengumuman website HMTE.',
}

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminContentFormPage documentId={id} kind="announcements" />
}
