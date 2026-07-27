import type { Metadata } from 'next'
import { AdminUsersManager } from '@/components/admin/AdminUsersManager'

export const metadata: Metadata = {
  title: 'Admin Akun HMTE',
  description: 'Tetapkan role dan bidang tiap akun admin HMTE.',
}

export default function AdminUsersPage() {
  return <AdminUsersManager />
}
