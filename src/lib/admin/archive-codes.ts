import { getFirebaseAuth } from '@/lib/firebase/client'

/*
 * Sisi panel dari kode akses arsip.
 *
 * Semua lewat rute server, bukan Firestore langsung: koleksi `archiveAccess`
 * ditutup di firestore.rules untuk semua orang, jadi panel tidak punya — dan
 * tidak perlu punya — cara membaca sidik jari kodenya. Yang bisa ia tanyakan
 * hanya "project mana yang sudah punya kode".
 *
 * Berbeda dari requestRevalidation yang sengaja diam saat gagal, fungsi-fungsi
 * ini melempar. Kode akses yang dikira sudah terpasang padahal belum akan
 * menerbitkan arsip privat tanpa kunci, dan itu kegagalan yang harus terlihat.
 */

async function authorizedFetch(input: string, init: RequestInit): Promise<Response> {
  const currentUser = getFirebaseAuth().currentUser
  if (!currentUser) throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      authorization: `Bearer ${await currentUser.getIdToken()}`,
      'content-type': 'application/json',
    },
  })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const result = await response.json().catch(() => null) as { error?: string } | null
  return result?.error || fallback
}

export async function fetchProjectsWithAccessCode(): Promise<string[]> {
  const response = await authorizedFetch('/api/admin/arsip-kode', { method: 'GET' })
  if (!response.ok) throw new Error(await readError(response, 'Gagal membaca daftar kode akses.'))

  const result = await response.json() as { projects?: unknown }
  return Array.isArray(result.projects) ? result.projects.filter((id): id is string => typeof id === 'string') : []
}

export async function setProjectAccessCode(projectId: string, code: string): Promise<void> {
  const response = await authorizedFetch('/api/admin/arsip-kode', {
    method: 'POST',
    body: JSON.stringify({ projectId, code }),
  })
  if (!response.ok) throw new Error(await readError(response, 'Gagal menyimpan kode akses.'))
}

export async function clearProjectAccessCode(projectId: string): Promise<void> {
  const response = await authorizedFetch('/api/admin/arsip-kode', {
    method: 'DELETE',
    body: JSON.stringify({ projectId }),
  })
  if (!response.ok) throw new Error(await readError(response, 'Gagal mencabut kode akses.'))
}
