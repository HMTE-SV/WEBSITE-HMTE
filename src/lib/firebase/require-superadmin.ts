import 'server-only'

import { getAdminDb, hasAdminCredentials } from './admin-app'
import { verifyFirebaseIdToken } from './verify-id-token'
import { readAdminClaims } from '@/lib/admin/claims'

/*
 * Gerbang untuk rute yang memegang kewenangan Admin SDK.
 *
 * Pemeriksaannya berlapis dua, dan lapisan keduanya bukan hiasan. Jalur utama
 * membaca `role` dari custom claims di token. Tapi claims itu sendiri baru ada
 * setelah ada yang memasangnya, dan yang memasangnya adalah rute ini. Tanpa
 * jalan lain, proyek yang baru pindah ke claims akan terkunci rapat: tidak ada
 * satu pun akun yang bisa membuat akun pertama.
 *
 * Karena itu, akun tanpa claims masih boleh lewat kalau dokumen
 * `adminUsers/{uid}`-nya menyebut superadmin aktif. Dokumen itu dibaca dengan
 * Admin SDK di server, jadi tidak bergantung pada firestore.rules, dan tidak
 * bisa dipalsukan dari klien.
 */

export type SuperadminGate =
  | { ok: true; uid: string; email?: string }
  | { ok: false; status: number; error: string }

function bearerToken(request: Request) {
  const header = request.headers.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

export async function requireSuperadmin(request: Request): Promise<SuperadminGate> {
  if (!hasAdminCredentials()) {
    return {
      ok: false,
      status: 503,
      error: 'Server belum punya kredensial Firebase Admin. Isi FIREBASE_SERVICE_ACCOUNT.',
    }
  }

  const user = await verifyFirebaseIdToken(bearerToken(request))

  if (!user) {
    return { ok: false, status: 401, error: 'Sesi admin tidak sah. Masuk ulang lalu coba lagi.' }
  }

  const { role } = readAdminClaims(user.claims)

  if (role === 'superadmin') {
    return { ok: true, uid: user.uid, email: user.email }
  }

  // Role lain yang sudah punya claims ditolak di sini juga, tanpa membaca
  // Firestore. Kalau claims-nya bilang editor, dokumennya tidak akan bilang
  // lain, dan satu pembacaan tambahan hanya menambah biaya tiap penolakan.
  if (role) {
    return { ok: false, status: 403, error: 'Hanya superadmin yang boleh mengelola akun.' }
  }

  const snapshot = await getAdminDb().collection('adminUsers').doc(user.uid).get()
  const data = snapshot.data()

  if (!snapshot.exists || data?.role !== 'superadmin' || data?.active !== true) {
    return { ok: false, status: 403, error: 'Hanya superadmin yang boleh mengelola akun.' }
  }

  return { ok: true, uid: user.uid, email: user.email }
}
