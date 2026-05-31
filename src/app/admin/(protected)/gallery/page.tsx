import type { Metadata } from 'next'
import { AdminGalleryManager } from '@/components/admin/AdminGalleryManager'

export const metadata: Metadata = {
  title: 'Admin Galeri HMTE',
  description: 'Kelola galeri website HMTE.',
}

export default function AdminGalleryPage() {
  return <AdminGalleryManager />
}
