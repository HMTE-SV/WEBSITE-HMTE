import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'

export default function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>
}
