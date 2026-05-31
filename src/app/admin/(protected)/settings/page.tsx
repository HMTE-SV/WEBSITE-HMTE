import type { Metadata } from 'next'
import { AdminCollectionPage } from '@/components/admin/AdminCollectionPage'

export const metadata: Metadata = {
  title: 'Admin Settings HMTE',
  description: 'Pengaturan website HMTE.',
}

export default function AdminSettingsPage() {
  return (
    <AdminCollectionPage
      activeHref="/admin/settings"
      description="Kelola pengaturan global website dan preferensi admin."
      emptyBody="Pengaturan global akan didefinisikan setelah model Firestore dan rules siap."
      emptyTitle="Settings belum tersedia."
      kicker="Settings"
      title="Pengaturan website"
    />
  )
}
