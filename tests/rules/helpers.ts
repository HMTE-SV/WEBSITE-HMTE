import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

export const PROJECT_ID = 'hmte-rules-test'

/** Nilai apa pun boleh: emulator tidak memvalidasi host, hanya port. */
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'

export async function createTestEnvironment(): Promise<RulesTestEnvironment> {
  const [host, port] = EMULATOR_HOST.split(':')

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
 * Memasang profil admin lewat jalur yang mem-bypass rules.
 *
 * Harus lewat `withSecurityRulesDisabled`, karena rules sendiri melarang siapa
 * pun selain superadmin menulis ke `adminUsers` — dan pada tes pertama belum
 * ada satu pun superadmin yang bisa dipakai untuk membuatnya.
 */
export async function seedAdmin(
  testEnv: RulesTestEnvironment,
  uid: string,
  role: 'superadmin' | 'editor' | 'viewer',
  options: { active?: boolean; email?: string } = {},
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore() as unknown as Firestore, 'adminUsers', uid), {
      uid,
      email: options.email ?? `${uid}@hmte.test`,
      role,
      active: options.active ?? true,
      createdAt: now(),
      updatedAt: now(),
    })
  })
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
