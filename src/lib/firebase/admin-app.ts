import 'server-only'

import { existsSync, readFileSync } from 'node:fs'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

/*
 * Admin SDK untuk jalur server saja.
 *
 * Dipakai satu hal yang memang mustahil dari klien: menempelkan custom claims
 * ke akun. Claims itulah yang membuat editor bisa masuk tanpa dokumen Firestore
 * yang dibuat tangan, karena role-nya ikut di dalam token, bukan dicari lagi.
 *
 * Kredensialnya kunci penuh: ia melewati firestore.rules sepenuhnya. Karena itu
 * berkas ini `server-only`, dan tidak boleh diimpor komponen klien mana pun.
 *
 * Dua sumber kredensial, sengaja berurutan:
 * 1. FIREBASE_SERVICE_ACCOUNT, isi JSON-nya langsung atau versi base64-nya.
 *    Ini yang dipakai di produksi, karena Vercel tidak punya sistem berkas yang
 *    bisa diisi berkas rahasia.
 * 2. service-account.json di root, untuk pengembangan lokal. Sudah di-gitignore.
 *
 * Catatan versi: firebase-admin ditahan di 13.x. Yang 14.x menarik jwks-rsa 4
 * yang me-`require('jose')` versi 6, dan jose 6 hanya punya bentuk ESM. Di Node
 * yang belum mengizinkan require() memuat ESM, rute ini mati sebelum sempat
 * jalan dengan ERR_REQUIRE_ESM. Jalur 13.x memakai jose 4 yang masih punya
 * bentuk CommonJS, jadi ia hidup di Node versi mana pun yang dipakai peladen.
 */

const SERVICE_ACCOUNT_PATH = 'service-account.json'

type ServiceAccountShape = {
  project_id: string
  client_email: string
  private_key: string
}

function parseServiceAccount(raw: string): ServiceAccountShape | null {
  const trimmed = raw.trim()

  if (!trimmed) {
    return null
  }

  // Base64 lebih tahan banting sebagai nilai env: JSON mentah punya kutip dan
  // baris baru di private_key, dan sebagian panel env memotong keduanya diam-diam.
  const text = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8')

  try {
    const parsed = JSON.parse(text) as Partial<ServiceAccountShape>

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null
    }

    return parsed as ServiceAccountShape
  } catch {
    return null
  }
}

function readServiceAccount(): ServiceAccountShape | null {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT

  if (fromEnv) {
    return parseServiceAccount(fromEnv)
  }

  if (existsSync(SERVICE_ACCOUNT_PATH)) {
    return parseServiceAccount(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))
  }

  return null
}

let cachedApp: App | null = null

export function getAdminApp(): App | null {
  if (cachedApp) {
    return cachedApp
  }

  const existing = getApps()

  if (existing.length > 0) {
    cachedApp = existing[0]
    return cachedApp
  }

  const serviceAccount = readServiceAccount()

  if (!serviceAccount) {
    return null
  }

  cachedApp = initializeApp({
    credential: cert({
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
      projectId: serviceAccount.project_id,
    }),
  })

  return cachedApp
}

/**
 * Apakah jalur istimewa tersedia.
 *
 * Dipisah supaya rute API bisa menjawab 503 dengan sebab yang jelas, bukan
 * meledak dengan galat Admin SDK yang tidak menyebut env mana yang kurang.
 */
export function hasAdminCredentials() {
  return getAdminApp() !== null
}

export function getAdminAuth() {
  const app = getAdminApp()

  if (!app) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT belum diisi di server.')
  }

  return getAuth(app)
}

export function getAdminDb() {
  const app = getAdminApp()

  if (!app) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT belum diisi di server.')
  }

  return getFirestore(app)
}
