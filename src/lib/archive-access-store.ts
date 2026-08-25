import 'server-only'

import { getAdminDb, hasAdminCredentials } from '@/lib/firebase/admin-app'
import {
  DOWNLOADS_PRIVATE_ID,
  defaultDownloadsIndex,
  normalizeDownloadsIndex,
  type DownloadsIndex,
} from '@/lib/downloads'
import { verifyAccessCode, type ArchiveAccessRecord } from '@/lib/archive-access'

/*
 * Jalur istimewa ke arsip privat.
 *
 * Halaman publik membaca Firestore lewat SDK klien tanpa sesi, jadi apa pun
 * yang ia bisa baca ikut terbaca pengunjung. Dua koleksi di bawah ini justru
 * ditutup rapat di firestore.rules, dan satu-satunya yang bisa membukanya
 * adalah Admin SDK — yaitu berkas ini, setelah kode aksesnya terbukti.
 *
 * Tanpa kredensial Admin SDK, arsip privat tidak bisa dibuka sama sekali. Itu
 * pilihan yang disengaja: gagal tertutup, bukan gagal terbuka.
 */

const PRIVATE_COLLECTION = 'downloadsPrivate'
const ACCESS_COLLECTION = 'archiveAccess'

export function hasArchivePrivilegedAccess(): boolean {
  return hasAdminCredentials()
}

/** Dokumen induk berisi seluruh arsip, termasuk yang privat. */
export async function getMasterDownloadsIndex(): Promise<DownloadsIndex> {
  if (!hasAdminCredentials()) return defaultDownloadsIndex

  try {
    const snapshot = await getAdminDb().collection(PRIVATE_COLLECTION).doc(DOWNLOADS_PRIVATE_ID).get()
    if (!snapshot.exists) return defaultDownloadsIndex
    return normalizeDownloadsIndex(snapshot.data() as Record<string, unknown>)
  } catch (error) {
    console.warn('[arsip] Gagal membaca downloadsPrivate/index.', error)
    return defaultDownloadsIndex
  }
}

function toRecord(data: unknown): ArchiveAccessRecord | null {
  if (!data || typeof data !== 'object') return null
  const raw = data as Record<string, unknown>
  const hash = typeof raw.hash === 'string' ? raw.hash : ''
  const salt = typeof raw.salt === 'string' ? raw.salt : ''
  return hash && salt ? { hash, salt } : null
}

/**
 * Mencari project mana saja yang kodenya cocok.
 *
 * Pengunjung tidak diminta memilih project lebih dulu — ia hanya punya kode.
 * Karena itu kode dicoba ke seluruh catatan, dan semua yang cocok terbuka
 * sekaligus. Biayanya satu scrypt per project, yang justru menjadi pembatas
 * alami bagi percobaan borongan; pembatas kedua ada di rutenya.
 */
export async function matchAccessCode(code: string): Promise<string[]> {
  if (!hasAdminCredentials() || !code) return []

  const snapshot = await getAdminDb().collection(ACCESS_COLLECTION).get()
  const matched: string[] = []

  for (const document of snapshot.docs) {
    const record = toRecord(document.data())
    if (!record) continue
    if (await verifyAccessCode(code, record)) matched.push(document.id)
  }

  return matched
}

export async function setAccessRecord(projectId: string, record: ArchiveAccessRecord, actorEmail: string): Promise<void> {
  await getAdminDb().collection(ACCESS_COLLECTION).doc(projectId).set({
    ...record,
    updatedAt: new Date(),
    updatedBy: actorEmail,
  })
}

export async function deleteAccessRecord(projectId: string): Promise<void> {
  await getAdminDb().collection(ACCESS_COLLECTION).doc(projectId).delete()
}

export async function listProjectsWithAccessCode(): Promise<string[]> {
  if (!hasAdminCredentials()) return []
  const snapshot = await getAdminDb().collection(ACCESS_COLLECTION).select().get()
  return snapshot.docs.map((document) => document.id)
}
