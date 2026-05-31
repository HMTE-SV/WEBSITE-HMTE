import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Galeri HMTE',
  description: 'Kelola galeri website HMTE.',
}

export default function AdminGalleryPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/gallery"
      description="Kelola foto kegiatan dan arsip visual organisasi."
      emptyBody="Upload media akan disambungkan ke Firebase Storage pada phase media."
      emptyTitle="Galeri belum tersambung ke storage."
      kicker="Galeri"
      title="Kelola galeri"
    />
  )
}
