import type { Metadata } from 'next'
import { AdminHistoryManager } from '@/components/admin/AdminHistoryManager'

export const metadata: Metadata = {
  title: 'Riwayat Perubahan · Admin HMTE',
  description: 'Audit log dan revision history konten publik HMTE.',
}

export default function AdminHistoryPage() {
  return <AdminHistoryManager />
}
