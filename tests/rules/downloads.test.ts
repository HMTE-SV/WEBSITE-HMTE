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
