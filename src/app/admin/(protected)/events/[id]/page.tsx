import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Edit Agenda HMTE',
  description: 'Edit agenda website HMTE.',
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminContentFormPage documentId={id} kind="events" />
}
