import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { createTestEnvironment, now, seedAdmin, withTimestamps } from './helpers'

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
 * `adminUsers` adalah sumber kebenaran peran, jadi collection inilah sasaran
 * paling menarik untuk menaikkan hak sendiri. Semua tes di sini menjaga satu
 * hal: tidak ada yang bisa mempromosikan dirinya sendiri.
 */
describe('adminUsers', () => {
  it('admin boleh membaca profilnya sendiri', async () => {
    const editor = testEnv.authenticatedContext('redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'adminUsers', 'redaksi')))
  })

  it('admin tidak boleh mengintip profil admin lain', async () => {
    const editor = testEnv.authenticatedContext('redaksi')
    await assertFails(getDoc(doc(db(editor), 'adminUsers', 'boss')))
  })

  it('superadmin boleh membaca profil siapa pun', async () => {
    const boss = testEnv.authenticatedContext('boss')
    await assertSucceeds(getDoc(doc(db(boss), 'adminUsers', 'redaksi')))
  })

  it('editor tidak bisa mempromosikan dirinya jadi superadmin', async () => {
    const editor = testEnv.authenticatedContext('redaksi')
    await assertFails(
      updateDoc(doc(db(editor), 'adminUsers', 'redaksi'), { role: 'superadmin', updatedAt: now() }),
    )
  })

  it('viewer tidak bisa menaikkan dirinya jadi editor', async () => {
    const viewer = testEnv.authenticatedContext('pengamat')
    await assertFails(
      updateDoc(doc(db(viewer), 'adminUsers', 'pengamat'), { role: 'editor', updatedAt: now() }),
    )
  })

  it('orang luar tidak bisa mengangkat dirinya jadi admin', async () => {
    const orangLuar = testEnv.authenticatedContext('orang-luar')
    await assertFails(
      setDoc(
        doc(db(orangLuar), 'adminUsers', 'orang-luar'),
        withTimestamps({ uid: 'orang-luar', email: 'x@y.test', role: 'superadmin', active: true }),
      ),
    )
  })

  it('admin yang dinonaktifkan tidak bisa mengaktifkan dirinya kembali', async () => {
    await seedAdmin(testEnv, 'alumni', 'editor', { active: false })
    const alumni = testEnv.authenticatedContext('alumni')
    await assertFails(
      updateDoc(doc(db(alumni), 'adminUsers', 'alumni'), { active: true, updatedAt: now() }),
    )
  })

  it('superadmin boleh menonaktifkan admin lain', async () => {
    const boss = testEnv.authenticatedContext('boss')
    await assertSucceeds(
      updateDoc(doc(db(boss), 'adminUsers', 'redaksi'), { active: false, updatedAt: now() }),
    )
  })
})

describe('settings', () => {
  it('publik tidak bisa membaca settings', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'settings', 'site')))
  })

  it('editor boleh membaca tapi tidak boleh menulis settings', async () => {
    const editor = testEnv.authenticatedContext('redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'settings', 'site')))
    await assertFails(
      setDoc(doc(db(editor), 'settings', 'site'), withTimestamps({ key: 'site', value: {} })),
    )
  })

  it('superadmin boleh menulis settings', async () => {
    const boss = testEnv.authenticatedContext('boss')
    await assertSucceeds(
      setDoc(doc(db(boss), 'settings', 'site'), withTimestamps({ key: 'site', value: {} })),
    )
  })
})
