import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'

/*
 * Menyegarkan halaman publik segera setelah panel menyimpan sesuatu.
 *
 * Tanpa ini, satu-satunya jaring pengaman adalah `revalidate = 300` di tiap
 * halaman, dan pengurus yang baru menerbitkan berita akan melihat halaman lama
 * lalu menyimpulkan panelnya rusak. Yang dikirim panel bukan path bebas
 * melainkan nama kelompok: path bebas dari klien berarti siapa pun yang punya
 * akun bisa menyuruh server membangun ulang halaman apa saja berulang kali.
 */

/*
 * Hanya dua kelompok, karena hanya dua collection yang benar-benar dibaca
 * halaman publik: `articles` lewat src/lib/article-data.ts dan `leaders` /
 * `divisions` / `programs` lewat src/lib/organization-data.ts. Collection
 * `announcements`, `events`, dan `gallery` sudah bisa dikelola dari panel tapi
 * halaman publiknya masih memakai data statis di src/data, jadi menyegarkannya
 * tidak akan mengubah apa pun. Tambahkan di sini saat halamannya sudah pindah.
 */
const revalidationTargets = {
  articles: ['/berita', '/'],
  organization: ['/kepengurusan', '/program-kerja', '/agenda', '/'],
} as const

export type RevalidationTarget = keyof typeof revalidationTargets

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const header = request.headers.get('authorization') || ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = await verifyFirebaseIdToken(idToken)

  if (!user) {
    return NextResponse.json({ error: 'Sesi admin tidak sah.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as { target?: string } | null
  const target = body?.target

  if (!target || !(target in revalidationTargets)) {
    return NextResponse.json({ error: 'Target revalidasi tidak dikenal.' }, { status: 400 })
  }

  const paths = revalidationTargets[target as RevalidationTarget]
  paths.forEach((path) => revalidatePath(path))

  /*
   * Rute dinamis tidak bisa didaftar satu per satu di atas: slugnya berbeda
   * untuk setiap dokumen. revalidatePath dengan tipe 'page' menyegarkan seluruh
   * varian rutenya sekaligus.
   */
  if (target === 'articles') {
    revalidatePath('/berita/[slug]', 'page')
  }

  if (target === 'organization') {
    revalidatePath('/divisi/[slug]', 'page')
    revalidatePath('/pengurus/[slug]', 'page')
    revalidatePath('/program-kerja/[slug]', 'page')
  }

  return NextResponse.json({ revalidated: paths })
}
