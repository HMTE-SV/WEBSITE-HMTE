import type { Metadata } from 'next'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const metadata: Metadata = {
  title: 'Admin HMTE TRE SV UGM',
  description: 'Panel admin HMTE TRE SV UGM.',
}

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  )
}
