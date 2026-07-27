import 'server-only'

import { createRemoteJWKSet, jwtVerify } from 'jose'

/*
 * Memverifikasi ID token Firebase di sisi server tanpa Admin SDK.
 *
 * Admin SDK butuh service account, dan service account adalah kredensial
 * penuh yang harus ditaruh di env produksi. Untuk satu-satunya hal yang kita
 * perlukan di sini, yaitu memastikan pemanggil benar-benar pengguna proyek ini,
 * verifikasi tanda tangan JWT terhadap kunci publik Google sudah cukup dan
 * tidak menambah kredensial rahasia baru.
 *
 * Yang diperiksa: tanda tangan RS256 terhadap JWKS Google, `iss`, `aud`, masa
 * berlaku, dan `sub` yang tidak kosong. Ini persis pemeriksaan yang dilakukan
 * `verifyIdToken()` milik Admin SDK, kecuali pengecekan pencabutan sesi yang
 * memang butuh akses istimewa.
 */

const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

// Dibuat sekali di tingkat modul. createRemoteJWKSet menyimpan cache kunci dan
// menghormati header cache Google, jadi satu instance berarti satu permintaan
// jaringan per rotasi kunci, bukan satu per unggahan.
const jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL))

export type VerifiedFirebaseUser = {
  uid: string
  email?: string
  /**
   * Seluruh isi payload token, termasuk custom claims.
   *
   * Aman dipercaya justru karena tanda tangannya sudah diperiksa di sini:
   * claims hanya bisa dipasang Admin SDK, dan mengubah satu huruf pun di token
   * membuat verifikasi di atas gagal.
   */
  claims: Record<string, unknown>
}

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseUser | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  if (!projectId || !token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    })

    // `sub` adalah uid. Token tanpa subject bukan token pengguna, dan tidak
    // boleh lolos hanya karena tanda tangannya benar.
    if (typeof payload.sub !== 'string' || !payload.sub) {
      return null
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      claims: payload as Record<string, unknown>,
    }
  } catch {
    return null
  }
}
