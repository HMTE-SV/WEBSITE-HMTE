import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, type Firestore } from 'firebase/firestore'
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
  await seedAdmin(testEnv, 'redaksi', 'editor', { divisionCode: 'PH' })
  await seedAdmin(testEnv, 'pengamat', 'viewer')
})

const downloadsIndex = withTimestamps({
  projects: [
    {
      id: 'identitas-hmte',
      title: 'Identitas HMTE',
      description: 'Folder berkas identitas resmi.',
      type: 'archive',
      period: '2026/2027',
      status: 'published',
      order: 0,
      documents: [{
        id: 'logo-hmte',
        title: 'Logo HMTE',
        description: 'Berkas logo resmi.',
        kind: 'file',
        path: 'assets/unduhan/logo-hmte.zip',
        externalUrl: '',
        format: 'ZIP',
        status: 'ready',
        order: 0,
      }],
    },
  ],
  updatedBy: 'redaksi@hmte.test',
})

describe('downloads — siapa boleh membaca', () => {
  it('pengunjung anonim boleh membaca daftar unduhan', async () => {
    await seedDocument(testEnv, ['downloads', 'index'], downloadsIndex)
    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(getDoc(doc(db(anon), 'downloads', 'index')))
  })
})

describe('downloads — siapa boleh menulis', () => {
  it('pengunjung anonim tidak boleh menulis', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(setDoc(doc(db(anon), 'downloads', 'index'), downloadsIndex))
  })

  it('viewer tidak boleh menulis', async () => {
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertFails(setDoc(doc(db(viewer), 'downloads', 'index'), downloadsIndex))
  })

  it('editor boleh create dan update', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(setDoc(doc(db(editor), 'downloads', 'index'), downloadsIndex))

    await assertSucceeds(
      updateDoc(doc(db(editor), 'downloads', 'index'), { updatedBy: 'redaksi2@hmte.test', updatedAt: now() }),
    )
  })

  it('pusat arsip harus diberikan secara eksplisit kepada operator', async () => {
    await seedAdmin(testEnv, 'operator-terbatas', 'editor', {
      divisionCode: 'PH',
      permissions: ['media', 'programs'],
    })
    const operator = signedInAs(testEnv, 'operator-terbatas')
    await assertFails(setDoc(doc(db(operator), 'downloads', 'index'), downloadsIndex))

    await seedAdmin(testEnv, 'operator-arsip', 'editor', {
      divisionCode: 'PH',
      permissions: ['downloads'],
    })
    const operatorArsip = signedInAs(testEnv, 'operator-arsip')
    await assertSucceeds(setDoc(doc(db(operatorArsip), 'downloads', 'index'), downloadsIndex))
  })

  it('editor tidak boleh delete', async () => {
    await seedDocument(testEnv, ['downloads', 'index'], downloadsIndex)
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(deleteDoc(doc(db(editor), 'downloads', 'index')))
  })

  it('superadmin boleh delete', async () => {
    await seedDocument(testEnv, ['downloads', 'index'], downloadsIndex)
    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(deleteDoc(doc(db(boss), 'downloads', 'index')))
  })

  it('update yang mengubah createdAt ditolak', async () => {
    await seedDocument(testEnv, ['downloads', 'index'], downloadsIndex)
    const editor = signedInAs(testEnv, 'redaksi')

    await assertFails(
      updateDoc(doc(db(editor), 'downloads', 'index'), { createdAt: now(), updatedAt: now() }),
    )
  })
})

/*
 * Dokumen induk arsip. Bedanya dengan `downloads/index` cuma satu, tetapi itu
 * yang menopang seluruh gerbang kode akses: pengunjung tidak boleh membacanya.
 */
describe('downloadsPrivate — dokumen induk arsip', () => {
  it('pengunjung anonim tidak boleh membaca', async () => {
    await seedDocument(testEnv, ['downloadsPrivate', 'index'], downloadsIndex)
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'downloadsPrivate', 'index')))
  })

  it('viewer boleh membaca tetapi tidak boleh menulis', async () => {
    await seedDocument(testEnv, ['downloadsPrivate', 'index'], downloadsIndex)
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertSucceeds(getDoc(doc(db(viewer), 'downloadsPrivate', 'index')))
    await assertFails(setDoc(doc(db(viewer), 'downloadsPrivate', 'index'), downloadsIndex))
  })

  it('editor pemegang pusat arsip boleh menulis', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(setDoc(doc(db(editor), 'downloadsPrivate', 'index'), downloadsIndex))
  })

  it('editor tanpa izin pusat arsip ditolak', async () => {
    await seedAdmin(testEnv, 'operator-media', 'editor', {
      divisionCode: 'PH',
      permissions: ['media'],
    })
    const operator = signedInAs(testEnv, 'operator-media')
    await assertFails(setDoc(doc(db(operator), 'downloadsPrivate', 'index'), downloadsIndex))
  })

  it('hanya superadmin yang boleh delete', async () => {
    await seedDocument(testEnv, ['downloadsPrivate', 'index'], downloadsIndex)
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(deleteDoc(doc(db(editor), 'downloadsPrivate', 'index')))

    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(deleteDoc(doc(db(boss), 'downloadsPrivate', 'index')))
  })
})

/*
 * Sidik jari kode akses. Tertutup tanpa kecuali — bahkan superadmin.
 *
 * Bukan sekadar kehati-hatian: seluruh jalur yang sah memakai Admin SDK, yang
 * melewati berkas rules ini sepenuhnya. Kalau ada satu peran saja yang bisa
 * membacanya lewat SDK klien, sidik jari itu ikut terbawa ke browser.
 */
describe('archiveAccess — sidik jari kode akses', () => {
  const record = withTimestamps({ hash: 'a'.repeat(64), salt: 'b'.repeat(32), updatedBy: 'redaksi@hmte.test' })

  it('tidak ada peran mana pun yang boleh membacanya', async () => {
    await seedDocument(testEnv, ['archiveAccess', 'identitas-hmte'], record)

    for (const actor of ['boss', 'redaksi', 'pengamat']) {
      await assertFails(getDoc(doc(db(signedInAs(testEnv, actor)), 'archiveAccess', 'identitas-hmte')))
    }

    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'archiveAccess', 'identitas-hmte')))
  })

  it('tidak ada peran mana pun yang boleh menulisnya', async () => {
    for (const actor of ['boss', 'redaksi', 'pengamat']) {
      await assertFails(setDoc(doc(db(signedInAs(testEnv, actor)), 'archiveAccess', 'identitas-hmte'), record))
    }

    const anon = testEnv.unauthenticatedContext()
    await assertFails(setDoc(doc(db(anon), 'archiveAccess', 'identitas-hmte'), record))
  })
})
