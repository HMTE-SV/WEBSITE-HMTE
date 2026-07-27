import { getFirebaseAuth } from '@/lib/firebase/client'
import type { AdminRole } from '@/types/admin'

/*
 * Klien untuk /api/admin/accounts.
 *
 * Berbeda dari `requestRevalidation`, kegagalan di sini WAJIB dilempar. Kalau
 * penugasan role gagal diam-diam, panel akan menampilkan wewenang yang tidak
 * pernah terpasang, dan orangnya baru tahu saat semua simpanannya ditolak.
 */

async function authorizedFetch(method: 'POST' | 'PATCH', body: unknown) {
  const currentUser = getFirebaseAuth().currentUser

  if (!currentUser) {
    throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
  }

  const response = await fetch('/api/admin/accounts', {
    body: JSON.stringify(body),
    headers: {
      authorization: `Bearer ${await currentUser.getIdToken()}`,
      'content-type': 'application/json',
    },
    method,
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new Error(payload.error || 'Permintaan ke server gagal.')
  }

  return payload
}

export type CreateAccountInput = {
  email: string
  displayName?: string
  role: AdminRole
  divisionCode?: string
}

export type CreateAccountResult = {
  created: boolean
  resetLink: string
  uid: string
}

export async function createAdminAccount(input: CreateAccountInput) {
  return (await authorizedFetch('POST', input)) as CreateAccountResult
}

export type UpdateAccountInput = {
  uid: string
  role?: AdminRole
  divisionCode?: string
  active?: boolean
}

export async function updateAdminAccount(input: UpdateAccountInput) {
  await authorizedFetch('PATCH', input)
}
