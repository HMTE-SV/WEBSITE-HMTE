import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ARCHIVE_COOKIE_NAME, readUnlockedProjectIds } from '@/lib/archive-access'
import { getUnlockedArchive } from '@/lib/downloads-data'
import type { DownloadProjectType } from '@/lib/downloads'

/*
 * Isi arsip privat untuk sesi yang sudah membuktikan kodenya.
 *
 * Halaman /arsip tetap statis dan tidak pernah memuat sepotong pun isi privat
 * di HTML-nya. Bagian itu diminta terpisah dari sini, jadi tidak ada versi
 * halaman ter-cache yang bisa menyimpan rahasia orang lain.
 *
 * Daftar project yang boleh dibaca tidak datang dari permintaan, melainkan dari
 * kuki bertanda tangan — pemanggil tidak bisa menyebut id sendiri.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readType(request: Request): DownloadProjectType {
  const value = new URL(request.url).searchParams.get('type')
  return value === 'template' ? 'template' : 'archive'
}

export async function GET(request: Request) {
  const unlocked = await readUnlockedProjectIds((await cookies()).get(ARCHIVE_COOKIE_NAME)?.value)

  if (unlocked.length === 0) {
    return NextResponse.json({ projects: [], revealed: {} }, { headers: { 'cache-control': 'no-store' } })
  }

  const archive = await getUnlockedArchive(unlocked, readType(request))
  return NextResponse.json(archive, { headers: { 'cache-control': 'no-store' } })
}
