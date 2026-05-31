import type { Metadata } from 'next'
import { AdminContentListPage } from '@/components/admin/AdminContentListPage'

export const metadata: Metadata = {
  title: 'Admin Berita HMTE',
  description: 'Kelola berita website HMTE.',
}

export default function AdminArticlesPage() {
  return <AdminContentListPage kind="articles" />
}
