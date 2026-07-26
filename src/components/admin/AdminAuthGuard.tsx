'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { AdminLogoutButton } from './AdminLogoutButton'
import { AdminSessionProvider } from './AdminSessionContext'
import { canAccessAdminPath } from '@/data/admin-nav'
import { getAdminUserProfile } from '@/lib/firebase/admin-users'
import { getFirebaseAuth, hasFirebaseConfig } from '@/lib/firebase/client'
import type { AdminUser } from '@/types/admin'

type GuardState = 'loading' | 'authorized' | 'redirecting' | 'forbidden' | 'error'

type AdminAuthGuardProps = {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isFirebaseReady = hasFirebaseConfig()
  const [state, setState] = useState<GuardState>('loading')
  const [session, setSession] = useState<AdminUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isFirebaseReady) {
      return
    }

    let isMounted = true

    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      (user) => {
        if (!isMounted) {
          return
        }

        if (!user) {
          setSession(null)
          setState('redirecting')
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
          return
        }

        setState('loading')
        setError('')

        void getAdminUserProfile(user.uid)
          .then((profile) => {
            if (!isMounted) {
              return
            }

            if (!profile || !profile.active) {
              setSession(null)
              setError('Akun Firebase ini belum memiliki profil admin aktif di collection adminUsers.')
              setState('forbidden')
              return
            }

            if (!canAccessAdminPath(profile.role, pathname)) {
              setSession(profile)
              setError('Role akun ini tidak memiliki akses ke halaman tersebut.')
              setState('forbidden')
              return
            }

            setSession(profile)
            setState('authorized')
          })
          .catch((profileError: unknown) => {
            if (!isMounted) {
              return
            }

            setSession(null)
            setError(profileError instanceof Error ? profileError.message : 'Gagal memeriksa role admin.')
            setState('error')
          })
      },
      (authError) => {
        if (!isMounted) {
          return
        }

        setError(authError.message)
        setState('error')
      },
    )

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [isFirebaseReady, pathname, router])

  if (state === 'authorized' && session) {
    return <AdminSessionProvider session={session}>{children}</AdminSessionProvider>
  }

  const hasConfigError = !isFirebaseReady

  return (
    <main className="admin-auth-page">
      <section className="admin-status-panel" aria-live="polite">
        <span className="admin-kicker">Admin HMTE</span>
        <h1>
          {state === 'forbidden'
            ? 'Akses admin ditolak'
            : state === 'error' || hasConfigError
              ? 'Konfigurasi auth belum siap'
              : 'Memeriksa sesi admin'}
        </h1>
        <p>
          {hasConfigError
            ? 'Isi variabel NEXT_PUBLIC_FIREBASE_* di .env.local sesuai FIREBASE_SETUP.md.'
            : state === 'error' || state === 'forbidden'
              ? error
            : state === 'redirecting'
              ? 'Sesi admin belum aktif. Kamu akan diarahkan ke halaman login.'
              : 'Mohon tunggu sebentar.'}
        </p>
        {state === 'forbidden' && session ? (
          <Link className="admin-secondary-link" href="/admin">
            Kembali ke dashboard
          </Link>
        ) : null}
        {state === 'forbidden' ? <AdminLogoutButton /> : null}
        {state === 'error' || hasConfigError ? (
          <Link className="admin-secondary-link" href="/admin/login">
            Kembali ke login
          </Link>
        ) : null}
      </section>
    </main>
  )
}
