import type { Metadata } from 'next'
import { AdminContentListPage } from '@/components/admin/AdminContentListPage'

export const metadata: Metadata = {
  title: 'Data Publik · Admin HMTE',
}

export default function AdminDataPage() {
  return <AdminContentListPage kind="publicData" />
}
