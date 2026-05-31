import type { Metadata } from 'next'
import { AdminContentFormPage } from '@/components/admin/AdminContentFormPage'

export const metadata: Metadata = {
  title: 'Edit Berita HMTE',
  description: 'Edit berita website HMTE.',
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminContentFormPage documentId={id} kind="articles" />
}
