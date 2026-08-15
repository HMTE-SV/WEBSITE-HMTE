import type { Metadata } from 'next'
import Link from 'next/link'
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
      title="Dashboard"
      actions={<Link className="adm-btn" href="/admin/articles/new"><span aria-hidden="true">+</span> Buat publikasi</Link>}
    >
      <AdminDashboard />
    </AdminShell>
  )
}
