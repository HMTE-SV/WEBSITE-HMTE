'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'

export function AdminLogoutButton() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    setIsSigningOut(true)

    try {
      await signOut(getFirebaseAuth())
      router.replace('/admin/login')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <button
      className="adm-btn adm-btn--ghost adm-btn--icon adm-logout"
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      aria-label={isSigningOut ? 'Sedang keluar' : 'Keluar dari panel admin'}
      title="Keluar"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      </svg>
      <span className="sr-only">{isSigningOut ? 'Keluar...' : 'Keluar'}</span>
    </button>
  )
}
