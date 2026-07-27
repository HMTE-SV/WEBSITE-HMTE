import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, type Firestore } from 'firebase/firestore'
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
})

/**
 * Formulir aspirasi adalah satu-satunya pintu tulis yang terbuka untuk publik
 * tanpa login. Karena itu bentuk datanya diperiksa sangat ketat di rules —
 * berkas ini yang menjaga pemeriksaan itu tidak longgar tanpa sengaja.
 */
function aspiration(overrides: Record<string, unknown> = {}) {
  return withTimestamps({
    category: 'fasilitas',
    message: 'Lampu di ruang baca lantai dua sudah dua minggu mati dan belum diganti.',
    senderName: 'Budi',
    senderEmail: 'budi@mail.test',
    isAnonymous: false,
    status: 'submitted',
    internalNotes: '',
    ...overrides,
  })
}

describe('aspirations — pengiriman publik', () => {
  it('kiriman yang bentuknya benar diterima', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(setDoc(doc(db(anon), 'aspirations', 'sah'), aspiration()))
  })

  it('kiriman anonim tanpa nama dan email diterima', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertSucceeds(
      setDoc(
        doc(db(anon), 'aspirations', 'anonim'),
        aspiration({ isAnonymous: true, senderName: '', senderEmail: '' }),
      ),
    )
  })

  it('mengaku anonim tapi tetap menitip nama ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'bocor'), aspiration({ isAnonymous: true })),
    )
  })

  it('tidak anonim tapi nama kosong ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'tanpa-nama'), aspiration({ senderName: '' })),
    )
  })

  it('pesan terlalu pendek ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(setDoc(doc(db(anon), 'aspirations', 'pendek'), aspiration({ message: 'AC mati' })))
  })

  it('pesan melebihi 3000 karakter ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'panjang'), aspiration({ message: 'a'.repeat(3001) })),
    )
  })

  it('kategori di luar daftar ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'kategori'), aspiration({ category: 'spam' })),
    )
  })

  it('pengirim tidak bisa menetapkan statusnya sendiri jadi selesai', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'curang'), aspiration({ status: 'resolved' })),
    )
  })

  it('pengirim tidak bisa menyisipkan catatan internal', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'catatan'), aspiration({ internalNotes: 'sudah beres' })),
    )
  })

  it('field tambahan di luar daftar ditolak', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      setDoc(doc(db(anon), 'aspirations', 'sisipan'), aspiration({ isAdmin: true })),
    )
  })
})

describe('aspirations — kerahasiaan', () => {
  it('publik tidak bisa membaca aspirasi orang lain', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const anon = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(db(anon), 'aspirations', 'masuk')))
  })

  it('pengguna login biasa juga tidak bisa membacanya', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const orangLuar = signedInAs(testEnv, 'orang-luar')
    await assertFails(getDoc(doc(db(orangLuar), 'aspirations', 'masuk')))
  })

  it('admin aktif bisa membacanya', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(getDoc(doc(db(editor), 'aspirations', 'masuk')))
  })
})

describe('aspirations — penanganan admin', () => {
  it('editor boleh mengubah status dan catatan internal', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const editor = signedInAs(testEnv, 'redaksi')
    await assertSucceeds(
      updateDoc(doc(db(editor), 'aspirations', 'masuk'), {
        status: 'in_progress',
        internalNotes: 'Diteruskan ke PHAL.',
        updatedAt: now(),
      }),
    )
  })

  it('editor TIDAK boleh mengubah isi pesan aslinya', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(
      updateDoc(doc(db(editor), 'aspirations', 'masuk'), {
        message: 'Isi yang sudah dipelintir dan tidak lagi sesuai aslinya.',
        updatedAt: now(),
      }),
    )
  })

  it('hanya superadmin yang boleh menghapus', async () => {
    await seedDocument(testEnv, ['aspirations', 'masuk'], aspiration())
    const editor = signedInAs(testEnv, 'redaksi')
    await assertFails(deleteDoc(doc(db(editor), 'aspirations', 'masuk')))

    const boss = signedInAs(testEnv, 'boss')
    await assertSucceeds(deleteDoc(doc(db(boss), 'aspirations', 'masuk')))
  })
})
