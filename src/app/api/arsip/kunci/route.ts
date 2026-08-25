import { NextResponse } from 'next/server'
import { ARCHIVE_COOKIE_NAME } from '@/lib/archive-access'

/*
 * Menutup kembali arsip yang sudah dibuka.
 *
 * Ada karena komputer bersama itu nyata: perpustakaan, sekretariat, laptop yang
 * dipinjam. Tanpa tombol ini, sesi delapan jam berarti orang berikutnya yang
 * duduk di kursi yang sama ikut melihat isinya.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ locked: true })
  response.cookies.set({
    name: ARCHIVE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
