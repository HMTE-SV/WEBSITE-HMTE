import { beforeEach, describe, expect, it, vi } from 'vitest'

// `server-only` melempar begitu diimpor di luar lingkungan server Next. Modul
// yang diuji memang server-only; yang perlu dibuktikan di sini kriptografinya,
// bukan tempat ia boleh hidup.
vi.mock('server-only', () => ({}))

const { hashAccessCode, verifyAccessCode, normalizeAccessCode, isAcceptableAccessCode, signUnlockToken, readUnlockedProjectIds, hasArchiveAccessSecret } = await import('./archive-access')

const SECRET = 'kunci-uji-yang-cukup-panjang-untuk-hs256-0123456789'

describe('normalizeAccessCode', () => {
  it('mengabaikan spasi berlebih dan besar kecil huruf', () => {
    expect(normalizeAccessCode('  hmte  open house 2026 ')).toBe('HMTE OPEN HOUSE 2026')
  })

  it('nilai bukan string menjadi kosong', () => {
    expect(normalizeAccessCode(null)).toBe('')
    expect(normalizeAccessCode(12345678)).toBe('')
  })
})

describe('isAcceptableAccessCode', () => {
  it('menolak kode terlalu pendek atau terlalu panjang', () => {
    expect(isAcceptableAccessCode('ABCDE')).toBe(false)
    expect(isAcceptableAccessCode('A'.repeat(129))).toBe(false)
  })

  it('menerima kode sepanjang enam karakter ke atas', () => {
    expect(isAcceptableAccessCode('ABCDEF')).toBe(true)
  })
})

describe('hashAccessCode dan verifyAccessCode', () => {
  it('kode yang sama dengan garam berbeda menghasilkan sidik jari berbeda', async () => {
    const first = await hashAccessCode('RAHASIA-2026')
    const second = await hashAccessCode('RAHASIA-2026')
    expect(first.hash).not.toBe(second.hash)
    expect(first.salt).not.toBe(second.salt)
  })

  it('membuktikan kode yang benar dan menolak yang salah', async () => {
    const record = await hashAccessCode('RAHASIA-2026')
    await expect(verifyAccessCode('RAHASIA-2026', record)).resolves.toBe(true)
    await expect(verifyAccessCode('RAHASIA-2025', record)).resolves.toBe(false)
  })

  it('catatan cacat ditolak tanpa melempar', async () => {
    await expect(verifyAccessCode('RAHASIA-2026', { hash: '', salt: '' })).resolves.toBe(false)
    await expect(verifyAccessCode('RAHASIA-2026', { hash: 'bukan-hex', salt: 'aa' })).resolves.toBe(false)
    await expect(verifyAccessCode('', { hash: 'aa', salt: 'bb' })).resolves.toBe(false)
  })
})

describe('sesi arsip', () => {
  beforeEach(() => {
    process.env.ARCHIVE_ACCESS_SECRET = SECRET
  })

  it('tanpa rahasia yang cukup panjang, tidak ada sesi yang bisa terbit', async () => {
    process.env.ARCHIVE_ACCESS_SECRET = 'pendek'
    expect(hasArchiveAccessSecret()).toBe(false)
    await expect(signUnlockToken(['a'])).resolves.toBeNull()
    await expect(readUnlockedProjectIds('apa-pun')).resolves.toEqual([])
  })

  it('membaca kembali daftar project yang ditandatangani', async () => {
    const token = await signUnlockToken(['satu', 'dua', 'satu'])
    await expect(readUnlockedProjectIds(token!)).resolves.toEqual(['satu', 'dua'])
  })

  it('menolak kuki yang ditandatangani kunci lain', async () => {
    const token = await signUnlockToken(['satu'])
    process.env.ARCHIVE_ACCESS_SECRET = `${SECRET}-berbeda`
    await expect(readUnlockedProjectIds(token!)).resolves.toEqual([])
  })

  it('kuki kosong atau rusak tidak membuka apa pun', async () => {
    await expect(readUnlockedProjectIds(undefined)).resolves.toEqual([])
    await expect(readUnlockedProjectIds('a.b.c')).resolves.toEqual([])
  })
})
