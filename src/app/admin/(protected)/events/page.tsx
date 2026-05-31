import type { Metadata } from 'next'
import { AdminContentListPage } from '@/components/admin/AdminContentListPage'

export const metadata: Metadata = {
  title: 'Admin Agenda HMTE',
  description: 'Kelola agenda website HMTE.',
}

export default function AdminEventsPage() {
  return <AdminContentListPage kind="events" />
}
