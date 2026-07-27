import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

export const PROJECT_ID = 'hmte-rules-test'

/** Nilai apa pun boleh: emulator tidak memvalidasi host, hanya port. */
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'

/*
 * Claims tiap uid yang sudah diseed, supaya tes tidak perlu menulisnya dua kali.
 *
 * Sejak wewenang pindah ke custom claims, `authenticatedContext(uid)` polos
 * menghasilkan pengguna tanpa role sama sekali. Registry ini yang menyambungkan
 * `seedAdmin()` dengan `signedInAs()`, jadi satu penyebutan role di tes tetap
 * cukup untuk keduanya.
 */
const claimsByUid = new Map<string, Record<string, string>>()

export async function createTestEnvironment(): Promise<RulesTestEnvironment> {
  const [host, port] = EMULATOR_HOST.split(':')

  claimsByUid.clear()

  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host,
      port: Number.parseInt(port, 10),
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
}

export const now = () => Timestamp.now()

/** Stempel waktu yang dituntut `hasValidWriteTimestamps()`. */
export function withTimestamps<T extends Record<string, unknown>>(data: T) {
  return { ...data, createdAt: now(), updatedAt: now() }
}

/**
 * Menyiapkan satu akun admin: claims-nya, sekaligus dokumen direktorinya.
 *
 * Dokumennya harus lewat `withSecurityRulesDisabled`, karena rules kini
 * melarang penulisan `adminUsers` dari klien mana pun. Yang menentukan izin
 * adalah claims yang dicatat di sini, bukan dokumennya.
 */
export async function seedAdmin(
  testEnv: RulesTestEnvironment,
  uid: string,
  role: 'superadmin' | 'editor' | 'viewer',
  options: { active?: boolean; email?: string; divisionCode?: string } = {},
) {
  const active = options.active ?? true

  // Akun nonaktif tidak dapat `role` sama sekali. Ini persis yang dilakukan
  // `buildAdminClaims()` di aplikasi, dan tesnya harus meniru itu, bukan
  // menciptakan bentuk claims yang tidak pernah benar-benar terpasang.
  claimsByUid.set(
    uid,
    active
      ? { role, ...(role === 'editor' && options.divisionCode ? { divisionCode: options.divisionCode } : {}) }
      : {},
  )

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore() as unknown as Firestore, 'adminUsers', uid), {
      uid,
      email: options.email ?? `${uid}@hmte.test`,
      role,
      ...(options.divisionCode ? { divisionCode: options.divisionCode } : {}),
      active,
      createdAt: now(),
      updatedAt: now(),
    })
  })
}

/**
 * Konteks pengguna yang membawa claims hasil `seedAdmin()`.
 *
 * uid yang tidak pernah diseed sengaja tetap boleh dipakai, dan menghasilkan
 * pengguna tanpa claims. Itu memang yang diwakili "orang luar": punya akun
 * Firebase, tidak punya wewenang apa pun.
 */
export function signedInAs(testEnv: RulesTestEnvironment, uid: string) {
  return testEnv.authenticatedContext(uid, claimsByUid.get(uid) ?? {})
}

/** Menaruh dokumen langsung tanpa rules, untuk menyiapkan kondisi awal tes. */
export async function seedDocument(
  testEnv: RulesTestEnvironment,
  path: [string, string],
  data: Record<string, unknown>,
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore() as unknown as Firestore, path[0], path[1]), data)
  })
}
