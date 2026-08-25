/*
 * Memecah pusat arsip menjadi dokumen induk dan salinan publiknya.
 *
 * Sebelum kode akses ada, seluruh daftar tinggal di `downloads/index` yang
 * terbaca siapa pun. Sekarang kebenarannya pindah ke `downloadsPrivate/index`,
 * dan `downloads/index` menjadi cerminannya yang sudah disaring.
 *
 * Script ini yang membuat perpindahan itu. Semua project lama dianggap publik —
 * memang begitu keadaannya selama ini, dan menebak sebaliknya akan menghilangkan
 * arsip dari halaman tanpa ada yang meminta. Setelah ini jalan, sifat privat
 * dipasang satu per satu dari panel admin.
 *
 * Aman diulang: kalau induknya sudah ada, script berhenti dan tidak menimpanya.
 *
 * Jalankan: npm run migrate:arsip
 * Lihat rencananya dulu: npm run migrate:arsip -- --dry-run
 */

import { existsSync, readFileSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { normalizeDownloadsIndex, redactDownloadsIndexForPublic } from '../src/lib/downloads'

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

  const db = getFirestore()
  const masterRef = db.collection('downloadsPrivate').doc('index')
  const publicRef = db.collection('downloads').doc('index')

  const [master, current] = await Promise.all([masterRef.get(), publicRef.get()])

  if (master.exists) {
    console.log('downloadsPrivate/index sudah ada. Tidak ada yang dipindahkan.')
    return
  }

  if (!current.exists) {
    console.log('downloads/index belum ada. Tidak ada arsip yang perlu dipindahkan.')
    return
  }

  const index = normalizeDownloadsIndex(current.data() as Record<string, unknown>)
  const mirror = redactDownloadsIndexForPublic(index)
  const documentCount = index.projects.reduce((total, project) => total + project.documents.length, 0)

  console.log(`${index.projects.length} project, ${documentCount} dokumen. Semuanya ditandai publik.`)

  if (isDryRun) {
    console.log('Mode uji. Tidak ada yang ditulis.')
    return
  }

  // Induk lebih dulu. Kalau prosesnya putus di tengah, yang tertinggal adalah
  // salinan publik lama yang masih benar, bukan daftar tanpa induk.
  await masterRef.set({
    projects: index.projects,
    lockedProjects: { archive: 0, template: 0 },
    updatedBy: index.updatedBy,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  await publicRef.update({
    projects: mirror.projects,
    lockedProjects: mirror.lockedProjects,
    updatedAt: FieldValue.serverTimestamp(),
  })

  console.log('Selesai. downloadsPrivate/index dibuat dan downloads/index disegarkan.')
  console.log('Langkah berikutnya: isi ARCHIVE_ACCESS_SECRET, sebarkan firestore.rules, lalu tandai arsip privat dari panel.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
