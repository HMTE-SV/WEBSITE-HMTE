import type { Metadata } from 'next'
import { AdminAspirationsManager } from '@/components/admin/AdminAspirationsManager'

export const metadata: Metadata = {
  title: 'Admin Aspirasi HMTE',
  description: 'Kelola aspirasi mahasiswa HMTE.',
}

export default function AdminAspirationsPage() {
  return <AdminAspirationsManager />
}
