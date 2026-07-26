'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AdminUser } from '@/types/admin'

const AdminSessionContext = createContext<AdminUser | null>(null)

type AdminSessionProviderProps = {
  children: ReactNode
  session: AdminUser
}

export function AdminSessionProvider({ children, session }: AdminSessionProviderProps) {
  return <AdminSessionContext.Provider value={session}>{children}</AdminSessionContext.Provider>
}

export function useAdminSession() {
  const session = useContext(AdminSessionContext)

  if (!session) {
    throw new Error('useAdminSession harus digunakan di dalam AdminSessionProvider.')
  }

  return session
}
