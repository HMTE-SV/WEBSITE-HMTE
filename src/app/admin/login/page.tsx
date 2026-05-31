import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AdminLoginForm } from '@/components/admin/AdminLoginForm'

export const metadata: Metadata = {
  title: 'Login Admin HMTE TRE SV UGM',
  description: 'Masuk ke panel admin HMTE TRE SV UGM.',
}

function LoginFallback() {
  return <p className="admin-login-note">Memuat form login...</p>
}

export default function AdminLoginPage() {
  return (
    <main className="admin-auth-page">
      <section className="admin-login-shell">
        <div className="admin-login-intro">
          <span className="admin-kicker">Admin HMTE</span>
          <h1>Masuk untuk mengelola website.</h1>
          <p>
            Gunakan akun email/password yang sudah dibuat di Firebase Authentication. Role admin akan mengikuti
            model superadmin, editor, dan viewer.
          </p>
        </div>
        <div className="admin-login-panel">
          <Suspense fallback={<LoginFallback />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
