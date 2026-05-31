import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Kepengurusan HMTE',
  description: 'Kelola data kepengurusan HMTE.',
}

export default function AdminLeadersPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/leaders"
      description="Kelola pengurus, divisi, dan urutan tampil direktori kepengurusan."
      emptyBody="Data kepengurusan akan dikelola dari Firestore pada phase organisasi."
      emptyTitle="Kepengurusan masih memakai data lokal."
      kicker="Kepengurusan"
      title="Kelola kepengurusan"
    />
  )
}
