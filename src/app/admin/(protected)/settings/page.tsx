import type { Metadata } from 'next'
import { AdminSettingsManager } from '@/components/admin/AdminSettingsManager'

export const metadata: Metadata = {
  title: 'Admin Settings HMTE',
  description: 'Pengaturan website HMTE.',
}

export default function AdminSettingsPage() {
  return <AdminSettingsManager />
}
