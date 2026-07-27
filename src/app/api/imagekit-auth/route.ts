import { createHmac, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { verifyFirebaseIdToken } from '@/lib/firebase/verify-id-token'

/*
 * Menerbitkan tanda tangan unggah ImageKit untuk satu berkas.
 *
 * Tanpa gerbang, endpoint semacam ini adalah mesin token gratis: siapa pun yang
 * menemukan alamatnya bisa mengunggah apa pun ke akun ImageKit HMTE, dan
 * kuotanya habis oleh orang lain. Karena itu pemanggil wajib membawa ID token
 * Firebase yang sah. Proyek ini tidak punya pendaftaran mandiri maupun anonymous
 * auth, jadi akun Firebase hanya dimiliki pengurus yang dibuatkan lewat konsol.
 *
 * Masa berlaku sengaja pendek. Tanda tangan yang berumur panjang sama saja
 * dengan membocorkan kunci unggah, hanya lebih lambat.
 */

const TOKEN_LIFETIME_SECONDS = 240

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: 'ImageKit belum dikonfigurasi di server.' },
      { status: 503 },
    )
  }

  const header = request.headers.get('authorization') || ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const user = await verifyFirebaseIdToken(idToken)

  if (!user) {
    return NextResponse.json(
      { error: 'Sesi admin tidak sah. Masuk ulang lalu coba lagi.' },
      { status: 401 },
    )
  }

  const token = randomUUID()
  const expire = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS
  const signature = createHmac('sha1', privateKey).update(token + expire).digest('hex')

  return NextResponse.json({ token, expire, signature, publicKey })
}
