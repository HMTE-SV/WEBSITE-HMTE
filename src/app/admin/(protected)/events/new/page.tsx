import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Tambah Agenda HMTE',
  description: 'Tambah agenda website HMTE.',
}

export default function NewEventPage() {
  return <AdminContentFormPage kind="events" />
}
