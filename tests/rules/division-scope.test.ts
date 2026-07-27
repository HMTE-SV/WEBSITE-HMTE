import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, deleteDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createTestEnvironment, now, seedAdmin, seedDocument, signedInAs, withTimestamps } from './helpers'

/*
 * Pembatasan per-bidang.
 *
 * Ini gerbang sebelum panel dibagikan ke sembilan perwakilan bidang. Sebelum
 * aturan ini ada, satu editor mana pun bisa menghapus seluruh data pengurus dan
 * program milik semua bidang.
 */

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
  await seedAdmin(testEnv, 'kominfo', 'editor', { divisionCode: 'KOMINFO' })
  await seedAdmin(testEnv, 'iptek', 'editor', { divisionCode: 'IPTEK' })
  await seedAdmin(testEnv, 'belum-ditugaskan', 'editor')
})

const leaderIn = (divisionCode: string) =>
  withTimestamps({
    name: 'Seseorang',
    role: 'Staff',
    divisionCode,
    photo: '/a.png',
    active: true,
    order: 1,
  })

const programIn = (divisionCode: string) =>
  withTimestamps({
    name: 'Program',
    desc: 'Deskripsi.',
    divisionCode,
    status: 'Terjadwal',
    date: 'Maret 2026',
    months: [3],
    startDate: '',
    endDate: '',
    active: true,
    order: 1,
  })

describe('leaders: editor terkunci di bidangnya', () => {
  it('boleh membuat pengurus di bidang sendiri', async () => {
    const editor = signedInAs(testEnv, 'kominfo')
    await assertSucceeds(setDoc(doc(db(editor), 'leaders', 'baru'), leaderIn('KOMINFO')))
  })

  it('menolak pembuatan pengurus di bidang lain', async () => {
    const editor = signedInAs(testEnv, 'kominfo')
    await assertFails(setDoc(doc(db(editor), 'leaders', 'baru'), leaderIn('IPTEK')))
  })

  it('menolak pengubahan pengurus bidang lain', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-iptek'], leaderIn('IPTEK'))

    const editor = signedInAs(testEnv, 'kominfo')
    await assertFails(updateDoc(doc(db(editor), 'leaders', 'anak-iptek'), { role: 'Ketua', updatedAt: now() }))
  })

  it('menolak penghapusan pengurus bidang lain', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-iptek'], leaderIn('IPTEK'))

    const editor = signedInAs(testEnv, 'kominfo')
    await assertFails(deleteDoc(doc(db(editor), 'leaders', 'anak-iptek')))
  })

  it('menolak upaya menarik pengurus bidang lain ke bidang sendiri', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-iptek'], leaderIn('IPTEK'))

    const editor = signedInAs(testEnv, 'kominfo')
    await assertFails(
      updateDoc(doc(db(editor), 'leaders', 'anak-iptek'), {
        divisionCode: 'KOMINFO',
        updatedAt: now(),
      }),
    )
  })

  it('menolak upaya membuang anggota sendiri ke bidang orang lain', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-kominfo'], leaderIn('KOMINFO'))

    const editor = signedInAs(testEnv, 'kominfo')
    await assertFails(
      updateDoc(doc(db(editor), 'leaders', 'anak-kominfo'), {
        divisionCode: 'IPTEK',
        updatedAt: now(),
      }),
    )
  })

  it('mengizinkan pengubahan selama bidangnya tetap milik sendiri', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-kominfo'], leaderIn('KOMINFO'))

    const editor = signedInAs(testEnv, 'kominfo')
    await assertSucceeds(
      updateDoc(doc(db(editor), 'leaders', 'anak-kominfo'), { role: 'Kepala Biro', updatedAt: now() }),
    )
  })

  it('superadmin tidak terikat bidang mana pun', async () => {
    await seedDocument(testEnv, ['leaders', 'anak-iptek'], leaderIn('IPTEK'))

    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(setDoc(doc(db(boss), 'leaders', 'baru'), leaderIn('PSDM')))
    await assertSucceeds(deleteDoc(doc(db(boss), 'leaders', 'anak-iptek')))
  })
})

describe('programs: aturan yang sama berlaku', () => {
  it('boleh menulis program bidang sendiri, bukan bidang lain', async () => {
    const editor = signedInAs(testEnv, 'iptek')
    await assertSucceeds(setDoc(doc(db(editor), 'programs', 'punya-iptek'), programIn('IPTEK')))
    await assertFails(setDoc(doc(db(editor), 'programs', 'punya-orang'), programIn('KOMINFO')))
  })

  it('menolak penghapusan program bidang lain', async () => {
    await seedDocument(testEnv, ['programs', 'punya-kominfo'], programIn('KOMINFO'))

    const editor = signedInAs(testEnv, 'iptek')
    await assertFails(deleteDoc(doc(db(editor), 'programs', 'punya-kominfo')))
  })
})

describe('editor tanpa bidang tidak bisa menulis apa pun', () => {
  it('ditolak pada pembuatan pengurus, bidang apa pun', async () => {
    const editor = signedInAs(testEnv, 'belum-ditugaskan')
    await assertFails(setDoc(doc(db(editor), 'leaders', 'baru'), leaderIn('KOMINFO')))
  })

  it('tidak bisa mengklaim dokumen yang juga tidak punya bidang', async () => {
    // Dua-duanya kosong. Kalau perbandingannya polos, string kosong akan sama
    // dengan string kosong dan aksesnya lolos. Aturan menolaknya secara eksplisit.
    await seedDocument(
      testEnv,
      ['leaders', 'yatim'],
      withTimestamps({ name: 'Tanpa bidang', role: 'Staff', photo: '/a.png', active: true, order: 1 }),
    )

    const editor = signedInAs(testEnv, 'belum-ditugaskan')
    await assertFails(deleteDoc(doc(db(editor), 'leaders', 'yatim')))
  })

  it('dokumen tanpa bidang tetap bisa dibereskan superadmin', async () => {
    await seedDocument(
      testEnv,
      ['leaders', 'yatim'],
      withTimestamps({ name: 'Tanpa bidang', role: 'Staff', photo: '/a.png', active: true, order: 1 }),
    )

    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(deleteDoc(doc(db(boss), 'leaders', 'yatim')))
  })
})

describe('divisions: hanya superadmin', () => {
  const division = withTimestamps({
    code: 'KOMINFO',
    name: 'Komunikasi dan Informasi',
    shortName: 'KOMINFO',
    description: 'Deskripsi.',
    active: true,
    order: 1,
  })

  it('menolak editor mengubah daftar unsur organisasi', async () => {
    const editor = signedInAs(testEnv, 'kominfo')

    // Justru bidangnya sendiri. Kalau ini lolos, editor bisa menggeser pagar
    // wewenangnya sendiri dengan mengganti kode divisi.
    await assertFails(setDoc(doc(db(editor), 'divisions', 'kominfo'), division))
  })

  it('mengizinkan superadmin', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(setDoc(doc(db(boss), 'divisions', 'kominfo'), division))
  })
})

describe('leaderContacts ikut terkunci per bidang', () => {
  const contact = (divisionCode: string) =>
    withTimestamps({ email: 'orang@mail.ugm.ac.id', divisionCode })

  it('boleh menulis kontak bidang sendiri saja', async () => {
    const editor = signedInAs(testEnv, 'kominfo')
    await assertSucceeds(setDoc(doc(db(editor), 'leaderContacts', 'punya'), contact('KOMINFO')))
    await assertFails(setDoc(doc(db(editor), 'leaderContacts', 'lain'), contact('IPTEK')))
  })

  it('menolak pembacaan publik apa pun bidangnya', async () => {
    await seedDocument(testEnv, ['leaderContacts', 'punya'], contact('KOMINFO'))

    const anon = testEnv.unauthenticatedContext()
    await assertFails(deleteDoc(doc(db(anon), 'leaderContacts', 'punya')))
  })
})
