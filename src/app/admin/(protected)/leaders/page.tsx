import type { Metadata } from 'next'
import { AdminOrganizationManager } from '@/components/admin/AdminOrganizationManager'

export const metadata: Metadata = {
  title: 'Admin Kepengurusan HMTE',
  description: 'Kelola data anggota kepengurusan HMTE.',
}

export default function AdminLeadersPage() {
  return <AdminOrganizationManager kind="leaders" />
}
