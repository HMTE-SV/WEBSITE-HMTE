/*
 * Menyalin role dan bidang dari collection `adminUsers` ke custom claims.
 *
 * Ini jembatan sekali jalan menuju rules berbasis claims. Rules yang baru
 * membaca `request.auth.token.role`, dan token yang belum pernah diisi tidak
 * punya field itu sama sekali. Kalau rules didahulukan, semua akun yang ada
 * kehilangan akses serentak, termasuk superadmin yang seharusnya memperbaiki
 * keadaan. Jalankan script ini LEBIH DULU, baru sebarkan rules.
 *
 * Aman diulang. Akun yang claims-nya sudah benar dilewati, karena menyetel
 * claims memaksa token pengguna disegarkan dan itu mengganggu sesi yang sedang
 * berjalan tanpa memberi manfaat apa pun.
 *
 * Jalankan: npm run sync:claims
 * Lihat rencananya dulu: npm run sync:claims -- --dry-run
 */

import { existsSync, readFileSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { buildAdminClaims, claimsAreEqual, readAdminClaims } from '../src/lib/admin/claims'
import { isAdminRole } from '../src/types/admin'

const SERVICE_ACCOUNT_PATH = 'service-account.json'
const isDryRun = process.argv.includes('--dry-run')

function loadCredentials() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT

  if (fromEnv) {
    return JSON.parse(fromEnv.trim().startsWith('{') ? fromEnv : Buffer.from(fromEnv, 'base64').toString('utf8'))
  }

  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(
      `Tidak menemukan ${SERVICE_ACCOUNT_PATH}.\n`
        + 'Ambil dari Firebase Console: Project settings -> Service accounts -> Generate new private key.',
    )
    process.exit(1)
  }

  return JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'))
}

async function main() {
  if (getApps().length === 0) {
    initializeApp({ credential: cert(loadCredentials()) })
  }

  const snapshot = await getFirestore().collection('adminUsers').get()

  if (snapshot.empty) {
    console.log('Collection adminUsers kosong. Tidak ada yang perlu disalin.')
    return
  }

  if (isDryRun) {
    console.log('Mode uji. Tidak ada claims yang disetel.\n')
  }

  let diperbarui = 0
  let dilewati = 0
  let gagal = 0

  for (const document of snapshot.docs) {
    const data = document.data()
    const uid = typeof data.uid === 'string' && data.uid ? data.uid : document.id
    const label = typeof data.email === 'string' ? data.email : uid

    if (!isAdminRole(data.role)) {
      console.warn(`  lewat  ${label}: role "${String(data.role)}" tidak dikenal`)
      gagal += 1
      continue
    }

    const next = buildAdminClaims({
      active: data.active !== false,
      divisionCode: typeof data.divisionCode === 'string' ? data.divisionCode : null,
      role: data.role,
    })

    try {
      const account = await getAuth().getUser(uid)
      const current = readAdminClaims(account.customClaims || {})

      if (claimsAreEqual({ divisionCode: current.divisionCode, role: current.role ?? undefined }, next)) {
        dilewati += 1
        continue
      }

      if (!isDryRun) {
        await getAuth().setCustomUserClaims(uid, next)
      }

      const ringkasan = next.role
        ? `${next.role}${next.divisionCode ? ` / ${next.divisionCode}` : ''}`
        : 'tanpa akses (nonaktif)'
      console.log(`  set    ${label}: ${ringkasan}`)
      diperbarui += 1
    } catch {
      // Dokumen tanpa akun Firebase Authentication pasangannya. Ini justru
      // temuan yang berguna: dokumen semacam itu tidak pernah memberi akses ke
      // siapa pun, dan sebaiknya dihapus.
      console.warn(`  gagal  ${label}: tidak ada akun Firebase Auth dengan uid ${uid}`)
      gagal += 1
    }
  }

  console.log(`\n${diperbarui} disetel, ${dilewati} sudah sesuai, ${gagal} bermasalah.`)

  if (!isDryRun && diperbarui > 0) {
    console.log('Akun yang berubah perlu masuk ulang, atau menunggu tokennya disegarkan sendiri.')
  }
}

main().catch((error: unknown) => {
  console.error('Sinkronisasi gagal:', error instanceof Error ? error.message : error)
  process.exit(1)
})
