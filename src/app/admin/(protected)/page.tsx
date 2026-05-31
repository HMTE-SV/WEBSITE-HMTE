import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Admin HMTE TRE SV UGM',
  description: 'Panel admin HMTE TRE SV UGM.',
}

export default function AdminPage() {
  return (
    <AdminShell
      activeHref="/admin"
      description="Ringkasan status pengelolaan konten dan fondasi admin website."
      kicker="Dashboard"
      title="Panel pengelolaan website"
    >
      <AdminDashboard />
    </AdminShell>
  )
}
