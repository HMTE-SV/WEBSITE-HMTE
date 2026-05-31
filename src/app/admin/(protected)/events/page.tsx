import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Agenda HMTE',
  description: 'Kelola agenda website HMTE.',
}

export default function AdminEventsPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/events"
      description="Kelola agenda kegiatan HMTE yang akan tampil di halaman publik."
      emptyBody="CRUD agenda akan disambungkan ke Firestore pada phase konten berikutnya."
      emptyTitle="Agenda masih memakai data lokal."
      kicker="Agenda"
      title="Kelola agenda"
    />
  )
}
