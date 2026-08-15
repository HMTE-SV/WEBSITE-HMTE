import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'
import { readAdminClaims } from '@/lib/admin/claims'
import { hasAdminPermission, type AdminPermission } from '@/lib/admin/permissions'

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
 * Satu kelompok per collection yang punya pembaca publik.
 *
 * `articles` masuk ke '/' juga karena seksi kabar di beranda sekarang menerima
 * feed yang sama dengan /berita. Sebelumnya seksi itu membaca file statis, jadi
 * menyegarkan beranda memang tidak mengubah apa pun.
 */
const revalidationTargets = {
  announcements: ['/pengumuman'],
  articles: ['/berita', '/'],
  downloads: ['/arsip', '/template-dokumen', '/unduhan'],
  gallery: ['/galeri'],
  media: ['/'],
  organization: ['/kepengurusan', '/program-kerja', '/agenda', '/'],
  pages: ['/', '/kontak'],
  publicData: ['/data'],
  settings: ['/'],
} as const

const revalidationPermissions: Record<Exclude<keyof typeof revalidationTargets, 'settings'>, AdminPermission[]> = {
  announcements: ['announcements'],
  articles: ['articles'],
  downloads: ['downloads'],
  gallery: ['gallery'],
  media: ['media'],
  organization: ['leaders', 'programs', 'divisions'],
  pages: ['pages'],
  publicData: ['publicData'],
}

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

  const { role, permissions } = readAdminClaims(user.claims)
  const allowed = role === 'superadmin'
    || (role === 'editor'
      && target !== 'settings'
      && revalidationPermissions[target as keyof typeof revalidationPermissions]
        .some((permission) => hasAdminPermission({ role, permissions }, permission)))

  if (!allowed) {
    return NextResponse.json({ error: 'Akun ini tidak diberi akses untuk menyegarkan modul tersebut.' }, { status: 403 })
  }

  if (target === 'publicData') {
    revalidatePath('/data/[slug]', 'page')
  }

  if (target === 'organization') {
    revalidatePath('/divisi/[slug]', 'page')
    revalidatePath('/pengurus/[slug]', 'page')
    revalidatePath('/program-kerja/[slug]', 'page')
  }

  if (target === 'media' || target === 'settings') {
    revalidatePath('/', 'layout')
  }

  return NextResponse.json({ revalidated: paths })
}
