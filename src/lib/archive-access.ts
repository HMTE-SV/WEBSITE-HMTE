import 'server-only'

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { SignJWT, jwtVerify } from 'jose'

/*
 * Kode akses arsip: penyimpanan, pembuktian, dan sesi yang lahir darinya.
 *
 * Tiga hal sengaja tidak pernah bertemu klien. Kode aslinya hanya lewat sekali
 * saat dipasang dan sekali tiap kali dibuka, dan tidak disimpan di mana pun.
 * Yang tersimpan adalah turunan scrypt-nya di `archiveAccess/{projectId}`,
 * dokumen yang firestore.rules tolak untuk semua orang sehingga hanya Admin SDK
 * yang bisa menyentuhnya. Yang dipegang pengunjung cuma kuki bertanda tangan
 * berisi daftar id project yang sudah ia buka.
 *
 * scrypt, bukan SHA biasa: kode akses dibuat manusia dan pendek, jadi satu-
 * satunya pertahanan terhadap tebakan borongan adalah biaya per percobaan.
 */

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>

const SCRYPT_KEY_LENGTH = 32
const SALT_BYTES = 16

export const ARCHIVE_COOKIE_NAME = 'hmte_arsip'
export const ARCHIVE_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

/**
 * Atribut kuki sesi arsip, disatukan supaya membuka dan mengunci tidak pernah
 * berbeda — kuki yang dipasang dengan atribut berbeda dari yang menghapusnya
 * akan tertinggal hidup di browser.
 *
 * `sameSite: 'none'` bukan pelonggaran yang ceroboh, melainkan syarat agar
 * situs ini tetap berfungsi saat ditampilkan di dalam iframe dari domain lain.
 * Di konteks itu browser menganggap seluruh permintaan lintas-situs, dan kuki
 * `Lax` tidak pernah dikirim maupun disimpan — gerbangnya akan menerima kode
 * yang benar lalu melupakannya seketika.
 *
 * `partitioned` yang membuatnya tetap aman: kuki dikunci ke situs induk yang
 * memasang iframe-nya, jadi situs lain yang menyisipkan alamat yang sama
 * mendapat laci kosong, bukan sesi milik orang lain. Di peramban lama yang
 * belum mengenalnya, atribut ini diabaikan dan kukinya hanya menjadi `None`
 * biasa; itu tetap tidak membocorkan apa pun, karena jawaban rute berkas tidak
 * bisa dibaca lintas-asal.
 *
 * Di pengembangan lokal semuanya turun ke `lax` tanpa `secure`: `None` menuntut
 * `Secure`, dan kuki `Secure` tidak pernah tersimpan lewat http://localhost.
 */
export function archiveCookieOptions(maxAgeSeconds: number) {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    name: ARCHIVE_COOKIE_NAME,
    httpOnly: true,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    secure: isProduction,
    partitioned: isProduction,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

export type ArchiveAccessRecord = {
  hash: string
  salt: string
}

/**
 * Kode disamakan bentuknya sebelum dibandingkan.
 *
 * Kode ini disalin dari pesan, papan tulis, atau slide, jadi spasi dan besar
 * kecil huruf yang berbeda adalah kesalahan ketik, bukan kode yang salah.
 * Normalisasi yang sama dipakai saat memasang dan saat memeriksa — kalau hanya
 * satu sisi yang menormalkan, tidak ada kode yang pernah cocok.
 */
export function normalizeAccessCode(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function isAcceptableAccessCode(code: string): boolean {
  return code.length >= 6 && code.length <= 128
}

export async function hashAccessCode(code: string): Promise<ArchiveAccessRecord> {
  const salt = randomBytes(SALT_BYTES)
  const derived = await scrypt(code, salt, SCRYPT_KEY_LENGTH)
  return { hash: derived.toString('hex'), salt: salt.toString('hex') }
}

/**
 * Perbandingan berwaktu tetap. Perbandingan string biasa berhenti di bita
 * pertama yang beda, dan selisih waktunya cukup untuk menebak kode huruf demi
 * huruf lewat jaringan.
 */
export async function verifyAccessCode(code: string, record: ArchiveAccessRecord): Promise<boolean> {
  if (!code || !record.hash || !record.salt) return false

  let expected: Buffer
  try {
    expected = Buffer.from(record.hash, 'hex')
    if (expected.length !== SCRYPT_KEY_LENGTH) return false
  } catch {
    return false
  }

  const derived = await scrypt(code, Buffer.from(record.salt, 'hex'), SCRYPT_KEY_LENGTH)
  return timingSafeEqual(derived, expected)
}

function readSecret(): Uint8Array | null {
  const secret = process.env.ARCHIVE_ACCESS_SECRET

  // Rahasia pendek membuat tanda tangan kuki bisa ditebak, dan kuki yang bisa
  // ditebak sama saja dengan tidak ada kunci sama sekali.
  if (!secret || secret.length < 32) return null
  return new TextEncoder().encode(secret)
}

export function hasArchiveAccessSecret(): boolean {
  return readSecret() !== null
}

/**
 * Menerbitkan kuki sesi berisi daftar project yang sudah dibuka.
 *
 * Daftarnya ikut ditandatangani, bukan disimpan di server, supaya tidak ada
 * tabel sesi yang harus dibersihkan. Konsekuensinya kode yang dicabut tidak
 * langsung mematikan sesi yang sudah berjalan; masa berlakunya dibuat pendek
 * justru karena itu.
 */
export async function signUnlockToken(projectIds: string[]): Promise<string | null> {
  const secret = readSecret()
  if (!secret) return null

  const unique = Array.from(new Set(projectIds.filter((id) => typeof id === 'string' && id))).slice(0, 64)

  return new SignJWT({ projects: unique })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('hmte-archive')
    .setExpirationTime(`${ARCHIVE_SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret)
}

export async function readUnlockedProjectIds(token: string | undefined): Promise<string[]> {
  const secret = readSecret()
  if (!secret || !token) return []

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'hmte-archive',
    })
    const projects = payload.projects
    if (!Array.isArray(projects)) return []
    return projects.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}
