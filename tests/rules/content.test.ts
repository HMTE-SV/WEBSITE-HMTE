import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, type Firestore } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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
  // Editor selalu terikat satu bidang sejak pembatasan per-bidang berlaku.
  await seedAdmin(testEnv, 'redaksi', 'editor', { divisionCode: 'PH' })
  await seedAdmin(testEnv, 'pengamat', 'viewer')
  await seedAdmin(testEnv, 'alumni', 'editor', { active: false, divisionCode: 'PH' })
})

const publishedArticle = withTimestamps({
  title: 'Juara LKTI',
  slug: 'juara-lkti',
  excerpt: 'Ringkasan.',
  content: 'Isi berita.',
  category: 'prestasi',
  status: 'published',
})

const draftArticle = withTimestamps({
  title: 'Draf rahasia',
  slug: 'draf-rahasia',
  excerpt: 'Belum siap.',
  content: 'Isi draf.',
  category: 'prestasi',
  status: 'draft',
})

describe('articles — siapa boleh membaca', () => {
  it('pengunjung anonim boleh membaca artikel terbit', async () => {
    await seedDocument(testEnv, ['articles', 'terbit'], publishedArticle)
    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(getDoc(doc(db(anon), 'articles', 'terbit')))
  })

  it('pengunjung anonim TIDAK boleh membaca draf', async () => {
    await seedDocument(testEnv, ['articles', 'draf'], draftArticle)
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'articles', 'draf')))
  })

  it('pengguna login tanpa profil admin juga tidak bisa membaca draf', async () => {
    await seedDocument(testEnv, ['articles', 'draf'], draftArticle)
    const orangLuar = signedInAs(testEnv, 'orang-luar')
    await assertFails(getDoc(doc(db(orangLuar), 'articles', 'draf')))
  })

  it('admin aktif boleh membaca draf', async () => {
    await seedDocument(testEnv, ['articles', 'draf'], draftArticle)
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'articles', 'draf')))
  })

  it('admin yang sudah dinonaktifkan kehilangan akses draf', async () => {
    await seedDocument(testEnv, ['articles', 'draf'], draftArticle)
    const nonaktif = signedInAs(testEnv, 'alumni')
    await assertFails(getDoc(doc(db(nonaktif), 'articles', 'draf')))
  })
})

describe('articles — siapa boleh menulis', () => {
  it('pengunjung anonim tidak bisa membuat artikel', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(setDoc(doc(db(anon), 'articles', 'palsu'), publishedArticle))
  })

  it('viewer tidak bisa membuat artikel', async () => {
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertFails(setDoc(doc(db(viewer), 'articles', 'baru'), publishedArticle))
  })

  it('editor bisa membuat artikel', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(setDoc(doc(db(editor), 'articles', 'baru'), publishedArticle))
  })

  it('artikel tanpa stempel waktu ditolak', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(
      setDoc(doc(db(editor), 'articles', 'tanpa-waktu'), {
        title: 'Tanpa waktu',
        status: 'published',
      }),
    )
  })

  it('status di luar draft/published/archived ditolak', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(
      setDoc(
        doc(db(editor), 'articles', 'status-ngawur'),
        withTimestamps({ title: 'X', status: 'live' }),
      ),
    )
  })

  it('createdAt tidak bisa diubah saat update', async () => {
    await seedDocument(testEnv, ['articles', 'terbit'], publishedArticle)
    const editor = signedInAs(testEnv, 'redaksi')

    await assertSucceeds(
      updateDoc(doc(db(editor), 'articles', 'terbit'), { title: 'Judul baru', updatedAt: now() }),
    )
    await assertFails(
      updateDoc(doc(db(editor), 'articles', 'terbit'), { createdAt: now(), updatedAt: now() }),
    )
  })

  it('viewer tidak bisa menghapus artikel, editor bisa', async () => {
    await seedDocument(testEnv, ['articles', 'terbit'], publishedArticle)
    const viewer = signedInAs(testEnv, 'pengamat')
    await assertFails(deleteDoc(doc(db(viewer), 'articles', 'terbit')))

    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(deleteDoc(doc(db(editor), 'articles', 'terbit')))
  })
})

describe('data organisasi — hanya yang aktif yang publik', () => {
  const collections = ['leaders', 'divisions', 'programs', 'partners'] as const

  it.each(collections)('%s aktif boleh dibaca publik, yang nonaktif tidak', async (collection) => {
    await seedDocument(testEnv, [collection, 'tampil'], withTimestamps({ name: 'A', active: true }))
    await seedDocument(testEnv, [collection, 'sembunyi'], withTimestamps({ name: 'B', active: false }))

    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(getDoc(doc(db(anon), collection, 'tampil')))
    await assertFails(getDoc(doc(db(anon), collection, 'sembunyi')))
  })

  it.each(collections)('publik tidak bisa menulis ke %s', async (collection) => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), collection, 'sisipan'), withTimestamps({ name: 'X', active: true })),
    )
  })
})

describe('programs — months ikut tersimpan', () => {
  it('editor bisa menyimpan program lengkap dengan months', async () => {
    const editor = signedInAs(testEnv, 'redaksi')
    const ref = doc(db(editor), 'programs', 'sotm')

    await assertSucceeds(
      setDoc(
        ref,
        withTimestamps({
          name: 'SOTM',
          desc: 'Agenda SOTM.',
          divisionCode: 'PH',
          status: 'Berkala',
          date: 'Maret, Juni, September, dan Desember',
          months: [3, 6, 9, 12],
          active: true,
          order: 3,
        }),
      ),
    )

    const anon = testEnv.unauthenticatedContext()
    const snapshot = await getDoc(doc(db(anon), 'programs', 'sotm'))
    expect(snapshot.data()?.months).toEqual([3, 6, 9, 12])
  })
})

describe('kunci bawaan', () => {
  it('collection yang tidak dideklarasikan tertutup untuk semua orang', async () => {
    const boss = signedInAs(testEnv, 'boss')
    await assertFails(getDoc(doc(db(boss), 'collectionAsal', 'apa-saja')))
    await assertFails(setDoc(doc(db(boss), 'collectionAsal', 'apa-saja'), withTimestamps({ a: 1 })))
  })
})

describe('leaderContacts: email pengurus tertutup dari publik', () => {
  const contact = withTimestamps({ email: 'ketua@mail.ugm.ac.id', divisionCode: 'PH' })

  it('menolak pembacaan oleh pengunjung anonim', async () => {
    await seedDocument(testEnv, ['leaderContacts', 'ketua'], contact)

    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'leaderContacts', 'ketua')))
  })

  it('menolak pembacaan oleh akun login yang bukan admin aktif', async () => {
    await seedDocument(testEnv, ['leaderContacts', 'ketua'], contact)

    // Akun yang tidak punya dokumen adminUsers sama sekali.
    const orangLuar = signedInAs(testEnv, 'orang-luar')
    await assertFails(getDoc(doc(db(orangLuar), 'leaderContacts', 'ketua')))

    // Akun admin yang sudah dinonaktifkan, mis. pengurus periode lalu.
    const alumni = signedInAs(testEnv, 'alumni')
    await assertFails(getDoc(doc(db(alumni), 'leaderContacts', 'ketua')))
  })

  it('mengizinkan pembacaan oleh viewer, karena ia admin aktif', async () => {
    await seedDocument(testEnv, ['leaderContacts', 'ketua'], contact)

    const pengamat = signedInAs(testEnv, 'pengamat')
    await assertSucceeds(getDoc(doc(db(pengamat), 'leaderContacts', 'ketua')))
  })

  it('hanya editor ke atas yang boleh menulis', async () => {
    const redaksi = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(setDoc(doc(db(redaksi), 'leaderContacts', 'ketua'), contact))

    const pengamat = signedInAs(testEnv, 'pengamat')
    await assertFails(setDoc(doc(db(pengamat), 'leaderContacts', 'wakil'), contact))

    const anon = testEnv.unauthenticatedContext()
    await assertFails(setDoc(doc(db(anon), 'leaderContacts', 'bendahara'), contact))
  })

  it('memastikan email tidak ikut terbawa dokumen pengurus yang publik', async () => {
    await seedDocument(
      testEnv,
      ['leaders', 'ketua'],
      withTimestamps({
        name: 'Latif',
        role: 'Ketua Himpunan',
        divisionCode: 'PH',
        photo: '/a.png',
        active: true,
        order: 1,
      }),
    )

    const anon = testEnv.unauthenticatedContext()
    const snapshot = await getDoc(doc(db(anon), 'leaders', 'ketua'))

    expect(snapshot.exists()).toBe(true)
    expect(snapshot.data()?.email).toBeUndefined()
  })
})
