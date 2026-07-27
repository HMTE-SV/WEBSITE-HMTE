import type { Metadata } from 'next'
import { AdminOrganizationManager } from '@/components/admin/AdminOrganizationManager'

export const metadata: Metadata = {
  title: 'Admin Divisi HMTE',
  description: 'Kelola unsur organisasi dan deskripsi divisi HMTE.',
}

export default function AdminDivisionsPage() {
  return <AdminOrganizationManager kind="divisions" />
}
