import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createTestEnvironment, now, seedAdmin, seedDocument, signedInAs, withTimestamps } from './helpers'

let testEnv: RulesTestEnvironment

const db = (context: { firestore: () => unknown }) => context.firestore() as Firestore

beforeAll(async () => {
  testEnv = await createTestEnvironment()
})

afterAll(async () => {
  await testEnv?.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await seedAdmin(testEnv, 'boss', 'superadmin')
  await seedAdmin(testEnv, 'redaksi', 'editor')
  await seedAdmin(testEnv, 'pengamat', 'viewer')
})

/**
 * `adminUsers` kini direktori yang bisa dibaca, bukan sumber wewenang. Yang
 * menentukan izin adalah custom claims di token.
 *
 * Tes di sini menjaga dua hal. Pertama, tidak ada yang bisa mempromosikan
 * dirinya sendiri. Kedua, dan ini yang baru: tidak ada seorang pun yang bisa
 * menulis ke sini dari klien, superadmin sekalipun. Dokumen yang berubah tanpa
 * claims yang ikut berubah adalah daftar yang berbohong soal wewenang.
 */
describe('adminUsers', () => {
  it('admin boleh membaca profilnya sendiri', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'adminUsers', 'redaksi')))
  })

  it('admin tidak boleh mengintip profil admin lain', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(getDoc(doc(db(editor), 'adminUsers', 'boss')))
  })

  it('superadmin boleh membaca profil siapa pun', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(getDoc(doc(db(boss), 'adminUsers', 'redaksi')))
  })

  it('editor tidak bisa mempromosikan dirinya jadi superadmin', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(
      updateDoc(doc(db(editor), 'adminUsers', 'redaksi'), { role: 'superadmin', updatedAt: now() }),
    )
  })

  it('viewer tidak bisa menaikkan dirinya jadi editor', async () => {
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertFails(
      updateDoc(doc(db(viewer), 'adminUsers', 'pengamat'), { role: 'editor', updatedAt: now() }),
    )
  })

  it('orang luar tidak bisa mengangkat dirinya jadi admin', async () => {
    const orangLuar = signedInAs(testEnv, 'orang-luar')
    await assertFails(
      setDoc(
        doc(db(orangLuar), 'adminUsers', 'orang-luar'),
        withTimestamps({ uid: 'orang-luar', email: 'x@y.test', role: 'superadmin', active: true }),
      ),
    )
  })

  it('admin yang dinonaktifkan tidak bisa mengaktifkan dirinya kembali', async () => {
    await seedAdmin(testEnv, 'alumni', 'editor', { active: false })
    const alumni = signedInAs(testEnv, 'alumni')
    await assertFails(
      updateDoc(doc(db(alumni), 'adminUsers', 'alumni'), { active: true, updatedAt: now() }),
    )
  })

  // Bukan pembatasan yang disayangkan, tapi justru intinya. Menonaktifkan
  // seseorang dengan mengubah dokumen ini tidak akan mencabut claims-nya, jadi
  // orangnya tetap punya akses penuh sementara panel menampilkannya nonaktif.
  // Jalannya lewat /api/admin/accounts, yang menyetel keduanya sekaligus.
  it('superadmin pun tidak bisa menonaktifkan admin lain langsung dari klien', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertFails(
      updateDoc(doc(db(boss), 'adminUsers', 'redaksi'), { active: false, updatedAt: now() }),
    )
  })

  it('superadmin tetap boleh melihat seluruh daftar akun', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(getDocs(collection(db(boss), 'adminUsers')))
  })

  it('editor tidak boleh melihat daftar akun', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(getDocs(collection(db(editor), 'adminUsers')))
  })
})

/*
 * Dua tes ini yang menjaga seluruh pindahan ke custom claims tetap bermakna.
 *
 * Kalau yang pertama lolos padahal seharusnya gagal, berarti rules diam-diam
 * masih membaca dokumen, dan biaya baca per tulis yang mau dihapus tidak pernah
 * benar-benar hilang. Kalau yang kedua gagal, berarti editor masih disandera
 * dokumen yang harus dibuat tangan, dan itu persis keluhan yang memulai semua
 * ini.
 */
describe('claims adalah satu-satunya sumber wewenang', () => {
  it('dokumen adminUsers tanpa claims tidak memberi wewenang apa pun', async () => {
    await seedDocument(testEnv, ['adminUsers', 'penyusup'], {
      active: true,
      email: 'penyusup@hmte.test',
      role: 'superadmin',
      uid: 'penyusup',
      ...withTimestamps({}),
    })

    // Sengaja tanpa signedInAs: uid ini punya dokumen, tapi tokennya kosong.
    const penyusup = testEnv.authenticatedContext('penyusup')
    await assertFails(
      setDoc(doc(db(penyusup), 'settings', 'site'), withTimestamps({ key: 'site', value: {} })),
    )
  })

  it('claims editor tetap bekerja tanpa dokumen adminUsers sama sekali', async () => {
    const editorBaru = testEnv.authenticatedContext('editor-baru', {
      divisionCode: 'KOMINFO',
      role: 'editor',
    })

    await assertSucceeds(
      setDoc(
        doc(db(editorBaru), 'programs', 'program-baru'),
        withTimestamps({ name: 'Program Baru', divisionCode: 'KOMINFO', active: true }),
      ),
    )
  })
})

const siteSettingsPayload = {
  address: 'Program Studi Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  agendaYear: 2026,
  cabinetName: 'Abya Vistara',
  closingCheer: 'ELEKTRO... SATU!!!',
  email: 'hmte.svugm@gmail.com',
  instagram: 'hmteugm',
  periodLabel: '2026/2027',
  tagline: 'Rumah bertumbuh.',
}

describe('settings', () => {
  /*
   * `settings/site` sengaja terbuka. Isinya nama kabinet dan kanal resmi, yang
   * memang tampil di kaki setiap halaman. Halaman publik dirender di server,
   * tapi Firestore tidak bisa membedakan pembaca server dari pembaca browser,
   * jadi tidak ada bentuk lain untuk membacanya.
   */
  it('publik boleh membaca settings/site', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(getDoc(doc(db(anon), 'settings', 'site')))
  })

  /*
   * Yang menjaga agar keterbukaan itu tidak menjalar. Kalau suatu saat ada
   * dokumen pengaturan lain yang menyimpan sesuatu yang tidak untuk umum, ia
   * tidak boleh ikut terbaca hanya karena tinggal di collection yang sama.
   */
  it('dokumen settings lain tetap tertutup dari publik', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'settings', 'integrasi')))
  })

  it('editor boleh membaca tapi tidak boleh menulis settings', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'settings', 'site')))
    await assertFails(
      setDoc(doc(db(editor), 'settings', 'site'), withTimestamps(siteSettingsPayload)),
    )
  })

  it('superadmin boleh menulis settings', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(
      setDoc(doc(db(boss), 'settings', 'site'), withTimestamps(siteSettingsPayload)),
    )
  })

  it('superadmin boleh menulis dokumen settings lain', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(
      setDoc(doc(db(boss), 'settings', 'integrasi'), withTimestamps({ key: 'integrasi' })),
    )
  })
})

describe('siteSettingsDrafts', () => {
  const draftPayload = { ...siteSettingsPayload, publicationState: 'draft', updatedBy: 'boss@hmte.test' }

  it('publik tidak boleh membaca draft pengaturan', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'siteSettingsDrafts', 'site')))
  })

  it('editor boleh membaca tetapi tidak boleh menulis draft pengaturan', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'siteSettingsDrafts', 'site')))
    await assertFails(
      setDoc(doc(db(editor), 'siteSettingsDrafts', 'site'), withTimestamps(draftPayload)),
    )
  })

  it('superadmin boleh membuat dan memperbarui draft pengaturan', async () => {
    const boss = signedInAs(testEnv, 'boss')
    const draftRef = doc(db(boss), 'siteSettingsDrafts', 'site')
    await assertSucceeds(setDoc(draftRef, withTimestamps(draftPayload)))
    await assertSucceeds(updateDoc(draftRef, { publicationState: 'published', updatedAt: now() }))
  })
})
