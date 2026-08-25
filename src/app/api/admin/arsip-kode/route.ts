import { NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'
import { readAdminClaims } from '@/lib/admin/claims'
import { hasAdminPermission } from '@/lib/admin/permissions'
import { hashAccessCode, isAcceptableAccessCode, normalizeAccessCode } from '@/lib/archive-access'
import {
  deleteAccessRecord,
  hasArchivePrivilegedAccess,
  listProjectsWithAccessCode,
  setAccessRecord,
} from '@/lib/archive-access-store'

/*
 * Memasang dan mencabut kode akses arsip.
 *
 * Kode aslinya lewat sini satu kali lalu hilang: yang tersimpan hanya turunan
 * scrypt-nya. Artinya kode yang lupa tidak bisa dilihat lagi, hanya bisa
 * diganti — dan itu memang perilaku yang benar untuk rahasia.
 *
 * Penyimpanannya di `archiveAccess/{projectId}`, yang firestore.rules tutup
 * untuk semua orang. Panel admin pun tidak membacanya langsung; ia hanya
 * bertanya ke rute ini project mana yang sudah punya kode.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireDownloadsEditor(request: Request) {
  const header = request.headers.get('authorization') || ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = await verifyFirebaseIdToken(idToken)

  if (!user) {
    return { error: NextResponse.json({ error: 'Sesi admin tidak sah. Masuk ulang lalu coba lagi.' }, { status: 401 }) }
  }

  const { role, permissions } = readAdminClaims(user.claims)
  const allowed = role === 'superadmin'
    || (role === 'editor' && hasAdminPermission({ role, permissions }, 'downloads'))

  if (!allowed) {
    return { error: NextResponse.json({ error: 'Akun ini tidak berwenang mengatur kode akses arsip.' }, { status: 403 }) }
  }

  return { email: user.email || '' }
}

function unavailable() {
  return NextResponse.json(
    { error: 'FIREBASE_SERVICE_ACCOUNT belum diisi di server, jadi kode akses belum bisa disimpan.' },
    { status: 503 },
  )
}

function readProjectId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : ''
  return id.length > 0 && id.length <= 128 && !id.includes('/') ? id : ''
}

export async function GET(request: Request) {
  const auth = await requireDownloadsEditor(request)
  if ('error' in auth) return auth.error
  if (!hasArchivePrivilegedAccess()) return unavailable()

  return NextResponse.json({ projects: await listProjectsWithAccessCode() })
}

export async function POST(request: Request) {
  const auth = await requireDownloadsEditor(request)
  if ('error' in auth) return auth.error
  if (!hasArchivePrivilegedAccess()) return unavailable()

  const body = (await request.json().catch(() => null)) as { projectId?: unknown; code?: unknown } | null
  const projectId = readProjectId(body?.projectId)
  const code = normalizeAccessCode(body?.code)

  if (!projectId) return NextResponse.json({ error: 'Project tidak dikenali.' }, { status: 400 })
  if (!isAcceptableAccessCode(code)) {
    return NextResponse.json({ error: 'Kode akses minimal 6 karakter.' }, { status: 400 })
  }

  await setAccessRecord(projectId, await hashAccessCode(code), auth.email)
  return NextResponse.json({ projectId, hasAccessCode: true })
}

export async function DELETE(request: Request) {
  const auth = await requireDownloadsEditor(request)
  if ('error' in auth) return auth.error
  if (!hasArchivePrivilegedAccess()) return unavailable()

  const body = (await request.json().catch(() => null)) as { projectId?: unknown } | null
  const projectId = readProjectId(body?.projectId)
  if (!projectId) return NextResponse.json({ error: 'Project tidak dikenali.' }, { status: 400 })

  await deleteAccessRecord(projectId)
  return NextResponse.json({ projectId, hasAccessCode: false })
}
