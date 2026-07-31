import type { Metadata } from 'next'
import { AdminMediaManager } from '@/components/admin/AdminMediaManager'

export const metadata: Metadata = {
  title: 'Pustaka Media · Admin HMTE',
  description: 'Kelola aset ImageKit dan slot gambar website HMTE.',
}

export default function AdminMediaPage() {
  return <AdminMediaManager />
}
