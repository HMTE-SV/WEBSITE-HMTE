import { describe, expect, it } from 'vitest'
import {
  isExternalResource,
  normalizeProgramCoordinators,
  normalizeProgramObjectives,
  normalizeProgramResources,
  normalizeProgramTimeline,
  sanitizeResourceUrl,
  PROGRAM_OBJECTIVE_LIMIT,
  PROGRAM_RESOURCE_LIMIT,
  PROGRAM_TIMELINE_LIMIT,
} from './program-detail'

describe('sanitizeResourceUrl', () => {
  it('menerima http, https, dan mailto', () => {
    expect(sanitizeResourceUrl('https://drive.google.com/berkas')).toBe('https://drive.google.com/berkas')
    expect(sanitizeResourceUrl('http://hmte.ugm.ac.id')).toBe('http://hmte.ugm.ac.id')
    expect(sanitizeResourceUrl('mailto:hmte@ugm.ac.id')).toBe('mailto:hmte@ugm.ac.id')
  })

  it('menerima alamat halaman situs sendiri', () => {
    expect(sanitizeResourceUrl('/berita/torsi-2026')).toBe('/berita/torsi-2026')
  })

  /*
   * Ini pemeriksaan keamanan, bukan kerapian. Alamat di sini diketik pengurus
   * lewat panel lalu dipasang langsung ke href di halaman publik.
   */
  it('menolak skema yang bisa menjalankan skrip', () => {
    expect(sanitizeResourceUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeResourceUrl('JavaScript:alert(1)')).toBe('')
    expect(sanitizeResourceUrl('data:text/html,<script>alert(1)</script>')).toBe('')
    expect(sanitizeResourceUrl('vbscript:msgbox(1)')).toBe('')
  })

  it('menolak alamat protokol-relatif yang menyamar sebagai halaman sendiri', () => {
    // `//evil.example` menuju domain lain, bukan halaman situs ini.
    expect(sanitizeResourceUrl('//evil.example/berkas')).toBe('')
  })

  it('menolak nilai yang bukan teks atau bukan alamat', () => {
    expect(sanitizeResourceUrl(undefined)).toBe('')
    expect(sanitizeResourceUrl(42)).toBe('')
    expect(sanitizeResourceUrl('   ')).toBe('')
    expect(sanitizeResourceUrl('bukan alamat')).toBe('')
  })
})

describe('isExternalResource', () => {
  it('membedakan tautan luar dari halaman sendiri', () => {
    expect(isExternalResource('https://ugm.ac.id')).toBe(true)
    expect(isExternalResource('/agenda')).toBe(false)
  })
})

describe('normalizeProgramObjectives', () => {
  it('membuang baris kosong dan duplikat tanpa peduli besar kecil huruf', () => {
    expect(
      normalizeProgramObjectives(['Sportivitas', '  ', 'sportivitas', 'Solidaritas', 42]),
    ).toEqual(['Sportivitas', 'Solidaritas'])
  })

  it('mengembalikan daftar kosong untuk bentuk yang tidak dikenal', () => {
    // Dokumen yang ditulis sebelum field ini ada mengembalikan undefined.
    expect(normalizeProgramObjectives(undefined)).toEqual([])
    expect(normalizeProgramObjectives('bukan array')).toEqual([])
  })

  it('memotong di batas render', () => {
    const many = Array.from({ length: 40 }, (_, index) => `Poin ${index}`)
    expect(normalizeProgramObjectives(many)).toHaveLength(PROGRAM_OBJECTIVE_LIMIT)
  })
})

describe('normalizeProgramCoordinators', () => {
  it('mempertahankan tulisan asli tapi menyaring nama kembar', () => {
    expect(normalizeProgramCoordinators(['Rifqi Ananda', 'rifqi ananda', 'Nadia'])).toEqual([
      'Rifqi Ananda',
      'Nadia',
    ])
  })
})

describe('normalizeProgramTimeline', () => {
  it('membuang tahapan tanpa judul', () => {
    const timeline = normalizeProgramTimeline([
      { label: 'Pelatihan Dasar', when: 'April', detail: 'Pembekalan pengurus.' },
      { label: '   ', when: 'Mei', detail: 'Tanpa judul.' },
      { when: 'Juni' },
      'bukan objek',
    ])

    expect(timeline).toEqual([
      { label: 'Pelatihan Dasar', when: 'April', detail: 'Pembekalan pengurus.' },
    ])
  })

  it('mengisi kolom pendukung yang hilang dengan teks kosong', () => {
    expect(normalizeProgramTimeline([{ label: 'Pelaksanaan' }])).toEqual([
      { label: 'Pelaksanaan', when: '', detail: '' },
    ])
  })

  it('memotong di batas render', () => {
    const many = Array.from({ length: 50 }, (_, index) => ({ label: `Tahap ${index}` }))
    expect(normalizeProgramTimeline(many)).toHaveLength(PROGRAM_TIMELINE_LIMIT)
  })
})

describe('normalizeProgramResources', () => {
  it('membuang berkas yang alamatnya tidak bisa dipakai', () => {
    const resources = normalizeProgramResources([
      { label: 'Proposal', url: 'https://contoh.test/proposal.pdf', note: 'PDF' },
      { label: 'Jahat', url: 'javascript:alert(1)' },
      { label: 'Tanpa alamat' },
    ])

    expect(resources).toEqual([
      { label: 'Proposal', url: 'https://contoh.test/proposal.pdf', note: 'PDF' },
    ])
  })

  it('memberi nama bawaan pada berkas yang alamatnya sah tapi tanpa judul', () => {
    expect(normalizeProgramResources([{ url: '/agenda' }])).toEqual([
      { label: 'Berkas program', url: '/agenda', note: '' },
    ])
  })

  it('memotong di batas render', () => {
    const many = Array.from({ length: 30 }, (_, index) => ({
      label: `Berkas ${index}`,
      url: `https://contoh.test/${index}`,
    }))
    expect(normalizeProgramResources(many)).toHaveLength(PROGRAM_RESOURCE_LIMIT)
  })
})
