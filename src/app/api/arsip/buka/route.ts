import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ARCHIVE_COOKIE_NAME,
  ARCHIVE_SESSION_MAX_AGE_SECONDS,
  hasArchiveAccessSecret,
  isAcceptableAccessCode,
  normalizeAccessCode,
  readUnlockedProjectIds,
  signUnlockToken,
} from '@/lib/archive-access'
import { hasArchivePrivilegedAccess, matchAccessCode } from '@/lib/archive-access-store'

/*
 * Menukar kode akses dengan sesi arsip.
 *
 * Pengunjung tidak memilih project lebih dulu — ia cuma punya selembar kode.
 * Server yang mencocokkannya ke seluruh catatan dan membuka semua yang cocok
 * sekaligus. Jawabannya tidak pernah menyebut project mana yang terbuka kalau
 * kodenya salah, dan tidak membedakan "kode salah" dari "tidak ada arsip
 * privat": keduanya menjawab hal yang sama, supaya rute ini tidak bisa dipakai
 * untuk memetakan isi arsip.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/*
 * Pembatas percobaan seadanya, di memori proses.
 *
 * Di lingkungan tanpa keadaan seperti Vercel, tiap instance punya hitungannya
 * sendiri, jadi ini memperlambat penebak, bukan menghentikannya. Pertahanan
 * utamanya tetap biaya scrypt per percobaan; ini lapisan yang membuat serangan
 * dari satu titik menjadi tidak nyaman.
 */
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 8
const attempts = new Map<string, { count: number; resetAt: number }>()

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
    return false
  }

  current.count += 1
  // Membersihkan sisa catatan kedaluwarsa sambil lewat, supaya peta ini tidak
  // tumbuh selamanya di proses yang berumur panjang.
  if (attempts.size > 512) {
    for (const [candidate, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(candidate)
    }
  }
  return current.count > MAX_ATTEMPTS
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  return forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'tanpa-alamat'
}

export async function POST(request: Request) {
  if (!hasArchiveAccessSecret() || !hasArchivePrivilegedAccess()) {
    return NextResponse.json(
      { error: 'Gerbang arsip belum dikonfigurasi di server. Hubungi pengurus.' },
      { status: 503 },
    )
  }

  if (tooManyAttempts(clientKey(request))) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null
  const code = normalizeAccessCode(body?.code)

  if (!isAcceptableAccessCode(code)) {
    return NextResponse.json({ error: 'Kode akses tidak dikenali.' }, { status: 400 })
  }

  const matched = await matchAccessCode(code)
  if (matched.length === 0) {
    return NextResponse.json({ error: 'Kode akses tidak dikenali.' }, { status: 401 })
  }

  // Kode kedua tidak membatalkan yang pertama: satu orang bisa memegang akses
  // ke beberapa arsip sekaligus tanpa harus memasukkannya ulang bergantian.
  const existing = await readUnlockedProjectIds((await cookies()).get(ARCHIVE_COOKIE_NAME)?.value)

  const token = await signUnlockToken([...existing, ...matched])
  if (!token) {
    return NextResponse.json({ error: 'Gerbang arsip belum dikonfigurasi di server.' }, { status: 503 })
  }

  const response = NextResponse.json({ unlocked: matched.length })
  response.cookies.set({
    name: ARCHIVE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ARCHIVE_SESSION_MAX_AGE_SECONDS,
  })
  return response
}
