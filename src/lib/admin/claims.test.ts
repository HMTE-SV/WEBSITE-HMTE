import { describe, expect, it } from 'vitest'
import { buildAdminClaims, claimsAreEqual, readAdminClaims } from './claims'

describe('buildAdminClaims', () => {
  it('akun nonaktif tidak membawa role sama sekali', () => {
    expect(buildAdminClaims({ active: false, divisionCode: 'KOMINFO', role: 'superadmin' })).toEqual({})
  })

  it('superadmin tidak membawa bidang meski dikirimi satu', () => {
    expect(buildAdminClaims({ active: true, divisionCode: 'KOMINFO', role: 'superadmin' })).toEqual({
      role: 'superadmin',
    })
  })

  it('editor membawa bidangnya', () => {
    expect(buildAdminClaims({ active: true, divisionCode: 'IPTEK', role: 'editor' })).toEqual({
      divisionCode: 'IPTEK',
      role: 'editor',
    })
  })

  /*
   * Editor tanpa bidang tetap sah, dan hasilnya akun yang tidak bisa mengubah
   * apa pun. Itu memang yang diinginkan: lebih baik terkunci sampai ditugaskan
   * daripada jatuh ke bidang kosong yang cocok dengan dokumen yatim mana pun.
   */
  it('editor tanpa bidang tidak mendapat divisionCode kosong', () => {
    expect(buildAdminClaims({ active: true, divisionCode: '  ', role: 'editor' })).toEqual({
      role: 'editor',
    })
  })
})

describe('readAdminClaims', () => {
  it('token pengunjung biasa tidak menghasilkan role', () => {
    expect(readAdminClaims({})).toEqual({ divisionCode: '', role: null })
  })

  it('role yang tidak dikenal ditolak, bukan diteruskan', () => {
    expect(readAdminClaims({ role: 'dewa' })).toEqual({ divisionCode: '', role: null })
  })

  it('membaca role dan bidang dari payload token', () => {
    expect(readAdminClaims({ divisionCode: 'PH', role: 'editor' })).toEqual({
      divisionCode: 'PH',
      role: 'editor',
    })
  })
})

describe('claimsAreEqual', () => {
  it('menganggap bidang kosong dan bidang tak ada sebagai hal yang sama', () => {
    expect(claimsAreEqual({ role: 'viewer' }, { divisionCode: '', role: 'viewer' })).toBe(true)
  })

  it('membedakan perpindahan bidang', () => {
    expect(
      claimsAreEqual({ divisionCode: 'PH', role: 'editor' }, { divisionCode: 'IPTEK', role: 'editor' }),
    ).toBe(false)
  })

  it('membedakan akun yang baru dinonaktifkan', () => {
    expect(claimsAreEqual({ role: 'editor' }, {})).toBe(false)
  })
})
