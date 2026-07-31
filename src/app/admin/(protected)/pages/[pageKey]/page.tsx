import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminPageEditor } from '@/components/admin/AdminPageEditor'
import { getPageDefinition, isPageKey } from '@/lib/page-content'

export async function generateMetadata({ params }: { params: Promise<{ pageKey: string }> }): Promise<Metadata> {
  const { pageKey } = await params
  return isPageKey(pageKey) ? { title: `Edit ${getPageDefinition(pageKey).label} · Admin HMTE` } : {}
}

export default async function AdminPageEditorRoute({ params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params
  if (!isPageKey(pageKey)) notFound()
  return <AdminPageEditor pageKey={pageKey} />
}
