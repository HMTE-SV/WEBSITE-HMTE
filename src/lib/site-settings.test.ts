import { describe, expect, it } from 'vitest'
import {
  defaultSiteSettings,
  formatCabinetTitle,
  instagramLabel,
  instagramUrl,
  normalizeInstagramHandle,
  normalizeSiteSettings,
} from './site-settings'

describe('normalizeSiteSettings', () => {
  it('dokumen yang belum ada jatuh ke nilai bawaan', () => {
    expect(normalizeSiteSettings(null)).toEqual(defaultSiteSettings)
  })

  /*
   * Ini keadaan normal, bukan kasus tepi: pengurus menyimpan nama kabinet lebih
   * dulu dan mengisi sisanya nanti. Kalau field kosong ikut terpakai, kaki
   * setiap halaman langsung kehilangan teksnya.
   */
  it('field kosong jatuh ke bawaan satu per satu, bukan seluruh objek', () => {
    const settings = normalizeSiteSettings({ cabinetName: 'Wira Nagara', closingCheer: '   ' })

    expect(settings.cabinetName).toBe('Wira Nagara')
    expect(settings.closingCheer).toBe(defaultSiteSettings.closingCheer)
  })

  it('memangkas spasi di ujung', () => {
    expect(normalizeSiteSettings({ periodLabel: '  2027/2028  ' }).periodLabel).toBe('2027/2028')
  })

  it('menerima tahun yang masuk akal', () => {
    expect(normalizeSiteSettings({ agendaYear: 2028 }).agendaYear).toBe(2028)
  })

  /*
   * Papan /agenda memakai angka ini sebagai sumbu. Satu nilai liar membuat
   * SELURUH program terbaca "di luar tahun papan" sekaligus, dan halamannya
   * kosong tanpa satu pun pesan error.
   */
  it.each([0, 1899, 999999, Number.NaN, 2026.5])('menolak tahun tidak sah: %s', (year) => {
    expect(normalizeSiteSettings({ agendaYear: year }).agendaYear).toBe(defaultSiteSettings.agendaYear)
  })

  it('tahun berupa teks tetap terbaca', () => {
    expect(normalizeSiteSettings({ agendaYear: '2029' }).agendaYear).toBe(2029)
  })
})

describe('normalizeInstagramHandle', () => {
  it.each([
    'hmteugm',
    '@hmteugm',
    'https://www.instagram.com/hmteugm',
    'https://instagram.com/hmteugm/',
    '  @hmteugm  ',
  ])('menyeragamkan %s', (input) => {
    expect(normalizeInstagramHandle(input)).toBe('hmteugm')
  })

  it('nama akun yang sudah bersih menghasilkan tautan yang hidup', () => {
    const settings = normalizeSiteSettings({ instagram: '@hmteugm' })

    expect(instagramUrl(settings)).toBe('https://www.instagram.com/hmteugm')
    expect(instagramLabel(settings)).toBe('@hmteugm')
  })
})

describe('formatCabinetTitle', () => {
  it('menambahkan kata Kabinet sekali, bukan dua kali', () => {
    expect(formatCabinetTitle(normalizeSiteSettings({ cabinetName: 'Abya Vistara' }))).toBe(
      'Kabinet Abya Vistara',
    )
  })
})
