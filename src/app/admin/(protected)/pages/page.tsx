import type { Metadata } from 'next'
import { AdminPageListManager } from '@/components/admin/AdminPageListManager'

export const metadata: Metadata = {
  title: 'Halaman Situs · Admin HMTE',
  description: 'Kelola konten halaman publik HMTE.',
}

export default function AdminPagesPage() {
  return <AdminPageListManager />
}
