/*
 * Mengisi Firestore dari data lokal di src/data.
 *
 * Kenapa ini ada: `organization-data.ts` punya gerbang yang mudah terlewat.
 * Kalau collection `divisions` kosong, SELURUH data organisasi jatuh ke
 * fallback lokal, termasuk pengurus dan program yang sudah diisi lewat panel.
 * Jadi menambah satu pengurus lewat panel tidak akan pernah terlihat di situs
 * sampai divisinya ada lebih dulu. Script ini yang menutup jurang itu.
 *
 * Idempoten. Id dokumen diturunkan dari slug, bukan diarang Firestore, jadi
 * menjalankannya dua kali memperbarui dokumen yang sama alih-alih menggandakan
 * seluruh kepengurusan. Aman diulang setelah data lokal diperbarui.
 *
 * Memakai Admin SDK, jadi ia MELEWATI firestore.rules sepenuhnya. Itu memang
 * yang dibutuhkan (tidak ada superadmin yang bisa dipakai sebelum data ada),
 * tapi juga alasan berkasnya tidak boleh pernah dipanggil dari kode aplikasi.
 *
 * Jalankan: npm run seed
 * Uji dulu tanpa menulis: npm run seed -- --dry-run
 */

import { existsSync, readFileSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { divisions } from '../src/data/divisions'
import { leadersByDivision } from '../src/data/leaders'
import { programsByDivision } from '../src/data/programs'
import { slugify } from '../src/lib/slug'
import { normalizeProgramMonths } from '../src/lib/program-schedule'
import type { DivisionCode } from '../src/types/content'

const SERVICE_ACCOUNT_PATH = 'service-account.json'
const isDryRun = process.argv.includes('--dry-run')

/*
 * Menghidupkan kembali dokumen yang sudah sengaja dihapus.
 *
 * Sejak halaman publik memakai Firestore sebagai otoritas keanggotaan,
 * menghapus pengurus di panel benar-benar menghapusnya dari situs. Tapi roster
 * di src/data tidak ikut berubah, jadi menjalankan seed lagi akan membuat
 * ulang orang yang barusan dikeluarkan, lengkap dengan `active: true`.
 *
 * Karena itu perilaku bawaannya sekarang: dokumen yang HILANG dari collection
 * yang sudah terisi dianggap sengaja dihapus, dan dilewati. Yang sudah ada
 * tetap diperbarui. Untuk pengisian awal collection kosong tidak ada bedanya.
 */
const allowResurrect = process.argv.includes('--allow-new')

const CREDENTIAL_INSTRUCTIONS = [
  'Ambil dari Firebase Console:',
  '  Project settings -> Service accounts -> Generate new private key',
  `Simpan hasilnya di root proyek dengan nama ${SERVICE_ACCOUNT_PATH}.`,
  'Berkas itu sudah masuk .gitignore.',
].join('\n')

function fail(...lines: string[]): never {
  console.error([...lines, '', CREDENTIAL_INSTRUCTIONS].join('\n'))
  process.exit(1)
}

/*
 * Kegagalan di sini dibedakan satu per satu, bukan dibiarkan jadi
 * "Unexpected end of JSON input". Berkas kosong dan berkas yang salah unduh
 * menghasilkan error bawaan yang tidak menyebut nama berkasnya sama sekali,
 * dan itu justru bentuk kegagalan yang paling sering terjadi di langkah ini.
 */
function loadCredentials() {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    fail(`Tidak menemukan ${SERVICE_ACCOUNT_PATH}.`)
  }

  const raw = readFileSync(SERVICE_ACCOUNT_PATH, 'utf8').trim()

  if (!raw) {
    fail(`${SERVICE_ACCOUNT_PATH} ada tapi masih kosong. Unduhannya belum masuk.`)
  }

  let parsed: Record<string, unknown>

  try {
    parsed = JSON.parse(raw)
  } catch {
    fail(`${SERVICE_ACCOUNT_PATH} bukan JSON yang sah. Pastikan isinya disalin utuh.`)
  }

  const missing = ['project_id', 'client_email', 'private_key'].filter((key) => !parsed[key])

  if (missing.length > 0) {
    fail(
      `${SERVICE_ACCOUNT_PATH} tidak berisi kunci service account.`,
      `Field yang hilang: ${missing.join(', ')}.`,
    )
  }

  console.log(`Proyek: ${String(parsed.project_id)}\n`)
  return parsed
}

function initializeAdmin() {
  if (getApps().length === 0) {
    initializeApp({ credential: cert(loadCredentials()) })
  }

  return getFirestore()
}

/**
 * Id dokumen yang stabil dan bisa dibaca manusia.
 *
 * Id acak dari `addDoc` membuat script ini mustahil idempoten: jalankan dua
 * kali, dapat dua Latif. Slug juga yang dipakai URL publik, jadi id dokumen dan
 * alamat halamannya jadi satu hal yang sama.
 */
function documentId(value: string) {
  return slugify(value)
}

type SeedCounts = { dibuat: number; diperbarui: number; dilewati: number }

/**
 * Membuang field bernilai kosong sebelum memperbarui dokumen yang sudah ada.
 *
 * Roster lokal tidak punya foto, bio, maupun tautan sosial: semuanya string
 * kosong. Tanpa penyaringan ini, menjalankan seed ulang untuk memperbaiki satu
 * field akan menghapus setiap foto dan bio yang sudah susah payah diisi lewat
 * panel, dan `merge: true` tidak menolong karena string kosong tetap sebuah
 * nilai. Pada dokumen baru justru sebaliknya: kerangka kosongnya dipertahankan
 * supaya bentuk dokumen tetap utuh sejak awal.
 */
function withoutEmptyValues(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ''))
}

async function seedCollection(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  rows: Array<{ id: string; data: Record<string, unknown> }>,
): Promise<SeedCounts> {
  const counts: SeedCounts = { dibuat: 0, diperbarui: 0, dilewati: 0 }

  // Satu pembacaan untuk seluruh collection, bukan per baris. Yang perlu
  // diketahui cuma "sudah pernah terisi atau belum".
  const existing = await db.collection(collectionName).limit(1).get()
  const isPopulated = !existing.empty

  for (const row of rows) {
    const ref = db.collection(collectionName).doc(row.id)
    const snapshot = await ref.get()
    const wouldResurrect = !snapshot.exists && isPopulated && !allowResurrect

    if (wouldResurrect) {
      counts.dilewati += 1
      continue
    }

    if (isDryRun) {
      counts[snapshot.exists ? 'diperbarui' : 'dibuat'] += 1
      continue
    }

    if (snapshot.exists) {
      // `createdAt` tidak disentuh. Rules menuntutnya tidak berubah, dan
      // menimpanya akan menghapus jejak kapan data itu pertama kali masuk.
      await ref.set(
        { ...withoutEmptyValues(row.data), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      )
      counts.diperbarui += 1
      continue
    }

    await ref.set({
      ...row.data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    counts.dibuat += 1
  }

  return counts
}

function buildDivisionRows() {
  return divisions.map((division) => ({
    // Kode divisi sudah unik dan pendek. Tidak ada gunanya menyluginya.
    id: division.code.toLowerCase(),
    data: {
      code: division.code,
      name: division.name,
      shortName: division.shortName,
      description: division.description,
      active: true,
      order: division.order,
    },
  }))
}

function buildLeaderRows() {
  const rows: Array<{ id: string; data: Record<string, unknown> }> = []
  const usedIds = new Map<string, number>()

  for (const [code, leaders] of Object.entries(leadersByDivision) as Array<[DivisionCode, typeof leadersByDivision[DivisionCode]]>) {
    leaders.forEach((leader, index) => {
      // Nama yang sama persis bisa muncul dua kali di kepengurusan besar.
      // Tanpa penomoran, yang kedua akan menimpa yang pertama diam-diam.
      const base = documentId(leader.name)
      const seen = usedIds.get(base) || 0
      usedIds.set(base, seen + 1)

      rows.push({
        id: seen === 0 ? base : `${base}-${seen + 1}`,
        data: {
          name: leader.name,
          role: leader.role,
          divisionCode: code,
          // Angkatan wajib ikut. Tanpa ini kolom angkatan di halaman publik
          // hanya hidup selama roster lokal masih menaungi Firestore, dan
          // roster itu justru yang sedang kita lepas.
          batch: leader.batch || '',
          photo: leader.photo,
          instagram: leader.instagram || '',
          linkedin: leader.linkedin || '',
          bio: leader.bio || '',
          active: true,
          order: index + 1,
        },
      })
    })
  }

  return rows
}

function buildProgramRows() {
  const rows: Array<{ id: string; data: Record<string, unknown> }> = []
  const usedIds = new Map<string, number>()

  for (const [code, programs] of Object.entries(programsByDivision) as Array<[DivisionCode, typeof programsByDivision[DivisionCode]]>) {
    programs.forEach((program, index) => {
      const base = documentId(program.name)
      const seen = usedIds.get(base) || 0
      usedIds.set(base, seen + 1)

      rows.push({
        id: seen === 0 ? base : `${base}-${seen + 1}`,
        data: {
          name: program.name,
          desc: program.desc,
          divisionCode: code,
          status: program.status,
          date: program.date,
          months: normalizeProgramMonths(program.months),
          // Wajib ikut, meski kosong. Buku Panduan cuma punya bulan rencana,
          // jadi tanggal pastinya diisi pengurus lewat panel. Kalau field ini
          // tidak pernah ada, dokumen lama dan dokumen baru punya bentuk
          // berbeda dan kolom tanggal di panel jadi tidak bisa dikosongkan.
          startDate: '',
          endDate: '',
          active: true,
          order: index + 1,
        },
      })
    })
  }

  return rows
}

async function main() {
  const db = initializeAdmin()

  const plan = [
    { name: 'divisions', rows: buildDivisionRows() },
    { name: 'leaders', rows: buildLeaderRows() },
    { name: 'programs', rows: buildProgramRows() },
  ]

  if (isDryRun) {
    console.log('Mode uji. Tidak ada yang ditulis.\n')
  }

  for (const step of plan) {
    const counts = await seedCollection(db, step.name, step.rows)
    console.log(
      `${step.name.padEnd(10)} ${String(step.rows.length).padStart(3)} dokumen  ` +
        `(${counts.dibuat} baru, ${counts.diperbarui} diperbarui, ${counts.dilewati} dilewati)`,
    )

    if (counts.dilewati > 0) {
      console.log(
        `           ${counts.dilewati} dianggap sudah sengaja dihapus dan tidak dibuat ulang. ` +
          'Pakai --allow-new kalau memang ingin memasukkannya kembali.',
      )
    }
  }

  console.log(
    isDryRun
      ? '\nJalankan tanpa --dry-run untuk benar-benar menulis.'
      : '\nSelesai. Situs publik sekarang membaca Firestore, bukan lagi src/data.',
  )
}

main().catch((error: unknown) => {
  console.error('Seed gagal:', error instanceof Error ? error.message : error)
  process.exit(1)
})
