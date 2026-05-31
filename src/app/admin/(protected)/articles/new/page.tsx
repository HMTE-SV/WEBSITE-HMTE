import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Tambah Berita HMTE',
  description: 'Tambah berita website HMTE.',
}

export default function NewArticlePage() {
  return <AdminContentFormPage kind="articles" />
}
