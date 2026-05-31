import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Berita HMTE',
  description: 'Kelola berita website HMTE.',
}

export default function AdminArticlesPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/articles"
      description="Kelola artikel dan berita yang akan tampil di kanal publik."
      emptyBody="CRUD berita, slug, dan status publish akan disambungkan ke Firestore pada phase konten berikutnya."
      emptyTitle="Berita masih memakai data lokal."
      kicker="Berita"
      title="Kelola berita"
    />
  )
}
