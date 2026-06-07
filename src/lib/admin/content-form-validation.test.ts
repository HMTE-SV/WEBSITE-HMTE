import { describe, expect, it } from 'vitest'
import {
  validateAnnouncementInput,
  validateArticleInput,
  validateEventInput,
} from './content-form-validation'

describe('admin content form validation', () => {
  it('rejects announcement payloads without a title and excerpt', () => {
    const result = validateAnnouncementInput({
      title: '',
      excerpt: '',
      body: '',
      date: '2026-06-01',
      status: 'draft',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Judul wajib diisi.')
    expect(result.errors).toContain('Ringkasan wajib diisi.')
  })

  it('accepts event payloads with title, excerpt, date, and status', () => {
    const result = validateEventInput({
      title: 'Workshop IoT',
      excerpt: 'Pelatihan embedded system untuk mahasiswa.',
      date: '2026-06-01',
      location: 'SV UGM',
      status: 'published',
    })

    expect(result).toEqual({
      success: true,
      errors: [],
    })
  })

  it('rejects article payloads without content and category', () => {
    const result = validateArticleInput({
      title: 'Berita HMTE',
      slug: 'berita-hmte',
      excerpt: 'Ringkasan berita.',
      content: '',
      category: '',
      status: 'draft',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Isi artikel wajib diisi.')
    expect(result.errors).toContain('Kategori wajib dipilih.')
  })

  it('allows article payloads without a slug when the title is present', () => {
    const result = validateArticleInput({
      title: 'Berita HMTE',
      slug: '',
      excerpt: 'Ringkasan berita.',
      content: 'Isi artikel lengkap untuk publikasi HMTE.',
      category: 'berita-utama',
      status: 'draft',
    })

    expect(result).toEqual({
      success: true,
      errors: [],
    })
  })
})
