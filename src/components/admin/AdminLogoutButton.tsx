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
    <button className="admin-secondary-button" type="button" onClick={handleLogout} disabled={isSigningOut}>
      {isSigningOut ? 'Keluar...' : 'Keluar'}
    </button>
  )
}
