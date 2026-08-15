import type { Metadata } from 'next'
import { AdminDownloadsManager } from '@/components/admin/AdminDownloadsManager'

export const metadata: Metadata = {
  title: 'Admin Unduhan HMTE',
  description: 'Kelola daftar berkas dan tautan unduhan HMTE.',
}

export default function AdminDownloadsPage() {
  return <AdminDownloadsManager />
}
