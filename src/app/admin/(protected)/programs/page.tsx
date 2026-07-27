import type { Metadata } from 'next'
import { AdminOrganizationManager } from '@/components/admin/AdminOrganizationManager'

export const metadata: Metadata = {
  title: 'Admin Program Kerja HMTE',
  description: 'Kelola program kerja, bulan rencana, dan tanggal pelaksanaan HMTE.',
}

export default function AdminProgramsPage() {
  return <AdminOrganizationManager kind="programs" />
}
