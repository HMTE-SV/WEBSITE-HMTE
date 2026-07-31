import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, writeBatch, type Firestore } from 'firebase/firestore'
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
  await seedAdmin(testEnv, 'redaksi', 'editor', { divisionCode: 'KOMINFO' })
  await seedAdmin(testEnv, 'pengamat', 'viewer')
})

const auditPayload = (actorUid = 'redaksi', actorRole = 'editor') => withTimestamps({
  action: 'update',
  actorEmail: `${actorUid}@hmte.test`,
  actorRole,
  actorUid,
  changedFields: ['title'],
  entityId: 'artikel-1',
  entityType: 'articles',
  revisionId: 'revision-1',
  summary: 'Memperbarui berita artikel-1',
})

const revisionPayload = withTimestamps({
  action: 'update',
  actorEmail: 'redaksi@hmte.test',
  actorRole: 'editor',
  actorUid: 'redaksi',
  after: { title: 'Baru' },
  before: { title: 'Lama' },
  changedFields: ['title'],
  entityId: 'artikel-1',
  entityType: 'articles',
})

describe('audit log dan revision', () => {
  it('menerima mutasi konten dan dua jejaknya dalam satu batch', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    const firestore = db(editor)
    const batch = writeBatch(firestore)

    batch.set(doc(firestore, 'articles', 'artikel-1'), withTimestamps({
      category: 'berita-utama',
      content: 'Isi.',
      excerpt: 'Ringkasan.',
      slug: 'artikel-1',
      status: 'draft',
      title: 'Artikel satu',
    }))
    batch.set(doc(firestore, 'contentRevisions', 'revision-1'), {
      ...revisionPayload,
      action: 'create',
      before: null,
    })
    batch.set(doc(firestore, 'auditLogs', 'audit-1'), {
      ...auditPayload(),
      action: 'create',
    })

    await assertSucceeds(batch.commit())
  })

  it('editor boleh membuat jejak dengan identitasnya sendiri', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(setDoc(doc(db(editor), 'auditLogs', 'audit-1'), auditPayload()))
    await assertSucceeds(setDoc(doc(db(editor), 'contentRevisions', 'revision-1'), revisionPayload))
  })

  it('actor uid dan role tidak boleh dipalsukan', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(setDoc(doc(db(editor), 'auditLogs', 'palsu-uid'), auditPayload('boss', 'editor')))
    await assertFails(setDoc(doc(db(editor), 'auditLogs', 'palsu-role'), auditPayload('redaksi', 'superadmin')))
  })

  it('viewer tidak boleh membuat jejak dan publik tidak boleh membacanya', async () => {
    await seedDocument(testEnv, ['auditLogs', 'audit-1'], auditPayload())
    const viewer = signedInAs(testEnv, 'pengamat')
    const anon = testEnv.unauthenticatedContext()

    await assertFails(setDoc(doc(db(viewer), 'auditLogs', 'baru'), auditPayload('pengamat', 'viewer')))
    await assertFails(getDoc(doc(db(anon), 'auditLogs', 'audit-1')))
    await assertSucceeds(getDoc(doc(db(viewer), 'auditLogs', 'audit-1')))
  })

  it('jejak dan snapshot tidak bisa diubah setelah dibuat', async () => {
    await seedDocument(testEnv, ['contentRevisions', 'revision-1'], revisionPayload)
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(updateDoc(doc(db(editor), 'contentRevisions', 'revision-1'), {
      after: { title: 'Dipalsukan' },
      updatedAt: now(),
    }))
  })
})

const mediaPayload = withTimestamps({
  alt: 'Pengurus berkegiatan',
  caption: '',
  consentStatus: 'confirmed',
  credit: 'KOMINFO',
  fileId: 'file-1',
  fileName: 'foto.webp',
  filePath: '/hmte/situs/foto.webp',
  focalPointX: 50,
  focalPointY: 50,
  folder: 'situs',
  height: 900,
  mimeType: 'image/webp',
  originalFileName: 'Foto.webp',
  size: 120000,
  status: 'active',
  thumbnailUrl: 'https://ik.imagekit.io/hmte/thumb.webp',
  url: 'https://ik.imagekit.io/hmte/foto.webp',
  width: 1600,
})

describe('media library dan slot', () => {
  it('editor boleh mengelola metadata media, viewer hanya membaca', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    const viewer = signedInAs(testEnv, 'pengamat')
    const ref = doc(db(editor), 'media', 'file-1')

    await assertSucceeds(setDoc(ref, mediaPayload))
    await assertSucceeds(getDoc(doc(db(viewer), 'media', 'file-1')))
    await assertFails(setDoc(doc(db(viewer), 'media', 'file-2'), mediaPayload))
  })

  it('metadata media tidak dibuka ke publik', async () => {
    await seedDocument(testEnv, ['media', 'file-1'], mediaPayload)
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'media', 'file-1')))
  })

  it('slot terbaca publik dan penempatannya hanya dapat diubah superadmin', async () => {
    const payload = withTimestamps({
      description: 'Logo kabinet aktif',
      fallbackUrl: '/assets/logo.webp',
      label: 'Logo kabinet',
      mediaId: 'file-1',
      slotKey: 'cabinet.logo',
    })
    const boss = signedInAs(testEnv, 'boss')
    const editor = signedInAs(testEnv, 'redaksi')
    const anon = testEnv.unauthenticatedContext()

    await assertFails(setDoc(doc(db(editor), 'mediaSlots', 'cabinet.logo'), payload))
    await assertSucceeds(setDoc(doc(db(boss), 'mediaSlots', 'cabinet.logo'), payload))
    await assertSucceeds(getDoc(doc(db(anon), 'mediaSlots', 'cabinet.logo')))
    await assertFails(updateDoc(doc(db(editor), 'mediaSlots', 'cabinet.logo'), {
      mediaId: 'file-lain',
      updatedAt: now(),
    }))
  })

  it('editor boleh menyinkronkan proyeksi publik tanpa mengganti penempatan slot', async () => {
    const payload = withTimestamps({
      description: 'Logo kabinet aktif',
      fallbackUrl: '/assets/logo.webp',
      label: 'Logo kabinet',
      mediaAlt: 'Logo kabinet baru',
      mediaHeight: 900,
      mediaId: 'file-1',
      mediaUrl: 'https://ik.imagekit.io/hmte/logo.webp',
      mediaWidth: 900,
      focalPointX: 50,
      focalPointY: 50,
      slotKey: 'cabinet.logo',
    })
    await seedDocument(testEnv, ['mediaSlots', 'cabinet.logo'], payload)
    const editor = signedInAs(testEnv, 'redaksi')

    await assertSucceeds(updateDoc(doc(db(editor), 'mediaSlots', 'cabinet.logo'), {
      focalPointX: 62,
      mediaAlt: 'Logo Kabinet Abya Vistara',
      updatedAt: now(),
    }))
  })
})

describe('konten halaman', () => {
  const pagePayload = withTimestamps({
    mediaAssignments: {},
    pageKey: 'home',
    sections: [{ id: 'hero', fields: { heroTitle: 'HMTE' }, label: 'Hero', order: 0, visible: true }],
    seoDescription: 'Halaman utama HMTE.',
    seoTitle: 'HMTE',
    updatedBy: 'redaksi@hmte.test',
  })

  it('membuka versi terbit ke publik dan menutup draft', async () => {
    await seedDocument(testEnv, ['pageContents', 'home'], pagePayload)
    await seedDocument(testEnv, ['pageContentDrafts', 'home'], { ...pagePayload, publicationState: 'draft' })
    const anon = testEnv.unauthenticatedContext()
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertSucceeds(getDoc(doc(db(anon), 'pageContents', 'home')))
    await assertFails(getDoc(doc(db(anon), 'pageContentDrafts', 'home')))
    await assertSucceeds(getDoc(doc(db(viewer), 'pageContentDrafts', 'home')))
  })

  it('editor boleh menyimpan dan menerbitkan copy, viewer tetap read-only', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertSucceeds(setDoc(doc(db(editor), 'pageContentDrafts', 'home'), { ...pagePayload, publicationState: 'draft' }))
    await assertSucceeds(setDoc(doc(db(editor), 'pageContents', 'home'), pagePayload))
    await assertFails(setDoc(doc(db(viewer), 'pageContents', 'contact'), { ...pagePayload, pageKey: 'contact' }))
  })
})
