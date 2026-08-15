import { NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'
import { readAdminClaims } from '@/lib/admin/claims'

const IMAGEKIT_FILES_API = 'https://api.imagekit.io/v1/files'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: Request) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  if (!privateKey) {
    return NextResponse.json({ error: 'ImageKit belum dikonfigurasi di server.' }, { status: 503 })
  }

  const header = request.headers.get('authorization') || ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = await verifyFirebaseIdToken(idToken)
  if (!user) {
    return NextResponse.json({ error: 'Sesi admin tidak sah. Masuk ulang lalu coba lagi.' }, { status: 401 })
  }

  if (readAdminClaims(user.claims).role !== 'superadmin') {
    return NextResponse.json({ error: 'Hanya superadmin yang boleh menghapus berkas media.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { fileId?: unknown } | null
  const fileId = typeof body?.fileId === 'string' ? body.fileId.trim() : ''
  if (!fileId || fileId.length > 256) {
    return NextResponse.json({ error: 'Identitas berkas tidak sah.' }, { status: 400 })
  }

  const authorization = Buffer.from(`${privateKey}:`).toString('base64')
  const response = await fetch(`${IMAGEKIT_FILES_API}/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      authorization: `Basic ${authorization}`,
    },
    cache: 'no-store',
  })

  // 404 berarti berkas penyedia sudah hilang. Catatan Firestore tetap harus
  // boleh dibersihkan agar operator dapat memulihkan pustaka yang tidak sinkron.
  if (!response.ok && response.status !== 404) {
    const result = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      { error: result?.message || 'ImageKit menolak penghapusan berkas.' },
      { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
    )
  }

  return NextResponse.json({ deleted: true })
}
