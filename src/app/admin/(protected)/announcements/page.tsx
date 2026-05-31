import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Pengumuman HMTE',
  description: 'Kelola pengumuman website HMTE.',
}

export default function AdminAnnouncementsPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/announcements"
      description="Kelola pengumuman yang akan tampil di halaman publik."
      emptyBody="CRUD pengumuman akan disambungkan ke Firestore pada phase konten berikutnya."
      emptyTitle="Pengumuman masih memakai data lokal."
      kicker="Pengumuman"
      title="Kelola pengumuman"
    />
  )
}
