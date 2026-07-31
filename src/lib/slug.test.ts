import { describe, expect, it } from 'vitest'
import { normalizeSlugInput, slugify } from './slug'

describe('normalizeSlugInput', () => {
  it('mempertahankan tanda hubung di akhir supaya slug multi-kata bisa diketik', () => {
    expect(normalizeSlugInput('berita-')).toBe('berita-')
    expect(normalizeSlugInput('berita baru')).toBe('berita-baru')
    expect(normalizeSlugInput('berita baru ')).toBe('berita-baru-')
  })

  it('membersihkan karakter yang tidak valid untuk URL', () => {
    expect(normalizeSlugInput('Rapat Besar!!! #2026')).toBe('rapat-besar-2026')
    expect(normalizeSlugInput('kegiatan/hmte')).toBe('kegiatan-hmte')
    expect(normalizeSlugInput('Halo & Selamat')).toBe('halo-dan-selamat')
  })

  it('tidak mengizinkan slug diawali tanda hubung', () => {
    expect(normalizeSlugInput('-')).toBe('')
    expect(normalizeSlugInput('--berita')).toBe('berita')
  })

  it('mengetik karakter demi karakter menghasilkan slug utuh', () => {
    const target = 'agenda tahunan 2026'
    let typed = ''

    for (const character of target) {
      typed = normalizeSlugInput(typed + character)
    }

    expect(typed).toBe('agenda-tahunan-2026')
  })
})

describe('slugify', () => {
  it('merapikan slug final tanpa tanda hubung menggantung', () => {
    expect(slugify('berita-')).toBe('berita')
    expect(slugify('  Judul Berita  ')).toBe('judul-berita')
  })
})
