import { getFirebaseAuth } from '@/lib/firebase/client'
import type { RevalidationTarget } from '@/app/api/revalidate/route'

/**
 * Meminta server menyegarkan halaman publik yang terpengaruh.
 *
 * Sengaja tidak pernah melempar. Penyimpanan ke Firestore sudah berhasil saat
 * fungsi ini dipanggil, dan revalidasi yang gagal hanya berarti halaman publik
 * terlambat paling lama lima menit. Melempar di sini akan menampilkan pesan
 * "gagal menyimpan" untuk data yang sebenarnya sudah tersimpan, dan pengurus
 * akan menyimpan ulang berkali-kali karena itu.
 */
export async function requestRevalidation(target: RevalidationTarget): Promise<void> {
  try {
    const currentUser = getFirebaseAuth().currentUser

    if (!currentUser) {
      return
    }

    await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await currentUser.getIdToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ target }),
    })
  } catch {
    // Sengaja dibiarkan. Lihat komentar di atas.
  }
}
