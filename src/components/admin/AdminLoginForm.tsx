'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth, hasFirebaseConfig } from '@/lib/firebase/client'

function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return 'Email atau password admin tidak valid.'
  }

  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan login. Coba lagi nanti.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Login gagal. Periksa koneksi dan konfigurasi Firebase.'
}

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFirebaseReady = hasFirebaseConfig()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(isFirebaseReady)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nextPath = useMemo(() => {
    const next = searchParams.get('next')
    return next?.startsWith('/admin') ? next : '/admin'
  }, [searchParams])

  useEffect(() => {
    if (!isFirebaseReady) {
      return
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (user) {
        router.replace(nextPath)
        return
      }

      setIsCheckingSession(false)
    })

    return unsubscribe
  }, [isFirebaseReady, nextPath, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password)
      router.replace(nextPath)
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <div className="admin-field">
        <label htmlFor="admin-email">Email admin</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={!isFirebaseReady || isCheckingSession || isSubmitting}
        />
      </div>
      <div className="admin-field">
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={!isFirebaseReady || isCheckingSession || isSubmitting}
        />
      </div>
      {!isFirebaseReady ? (
        <p className="admin-form-error" role="alert">
          Firebase belum dikonfigurasi. Isi .env.local sesuai FIREBASE_SETUP.md.
        </p>
      ) : error ? (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="admin-primary-button"
        type="submit"
        disabled={!isFirebaseReady || isCheckingSession || isSubmitting}
      >
        {isCheckingSession ? 'Memeriksa sesi...' : isSubmitting ? 'Masuk...' : 'Masuk ke admin'}
      </button>
      <Link className="admin-secondary-link" href="/">
        Kembali ke website
      </Link>
    </form>
  )
}
