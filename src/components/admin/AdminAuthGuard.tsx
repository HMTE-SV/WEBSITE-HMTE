'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth, hasFirebaseConfig } from '@/lib/firebase/client'

type GuardState = 'loading' | 'authenticated' | 'redirecting' | 'error'

type AdminAuthGuardProps = {
  children: ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isFirebaseReady = hasFirebaseConfig()
  const [state, setState] = useState<GuardState>('loading')
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

        if (user) {
          setState('authenticated')
          return
        }

        setState('redirecting')
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
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

  if (state === 'authenticated') {
    return children
  }

  const hasConfigError = !isFirebaseReady

  return (
    <main className="admin-auth-page">
      <section className="admin-status-panel" aria-live="polite">
        <span className="admin-kicker">Admin HMTE</span>
        <h1>{state === 'error' || hasConfigError ? 'Konfigurasi auth belum siap' : 'Memeriksa sesi admin'}</h1>
        <p>
          {hasConfigError
            ? 'Isi variabel NEXT_PUBLIC_FIREBASE_* di .env.local sesuai FIREBASE_SETUP.md.'
            : state === 'error'
              ? error
            : state === 'redirecting'
              ? 'Sesi admin belum aktif. Kamu akan diarahkan ke halaman login.'
              : 'Mohon tunggu sebentar.'}
        </p>
        {state === 'error' || hasConfigError ? (
          <Link className="admin-secondary-link" href="/admin/login">
            Kembali ke login
          </Link>
        ) : null}
      </section>
    </main>
  )
}
