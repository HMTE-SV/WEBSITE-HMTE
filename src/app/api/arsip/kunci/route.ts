import { NextResponse } from 'next/server'
import { archiveCookieOptions } from '@/lib/archive-access'

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
  // Atribut harus persis sama dengan saat dipasang, kecuali umurnya. Kuki yang
  // dihapus dengan atribut berbeda tidak tergantikan — ia tertinggal hidup.
  response.cookies.set({ ...archiveCookieOptions(0), value: '' })
  return response
}
