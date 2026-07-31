import { describe, expect, it } from 'vitest'
import { validateAnnouncementInput, validateArticleInput, validateGalleryInput } from './content-form-validation'

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

  it('accepts announcement payloads with title, excerpt, date, and status', () => {
    const result = validateAnnouncementInput({
      title: 'Pendaftaran asisten praktikum',
      excerpt: 'Dibuka sampai 20 Agustus untuk mahasiswa angkatan 2024 dan 2025.',
      body: 'Rincian syarat dan berkas.',
      date: '2026-08-01',
      status: 'published',
    })

    expect(result).toEqual({
      success: true,
      errors: [],
    })
  })

  it('rejects announcement payloads without a date', () => {
    // Tanggal bukan sekadar pelengkap: halaman publik mengurutkan pengumuman
    // dengan field ini, jadi yang kosong akan tenggelam di dasar daftar.
    const result = validateAnnouncementInput({
      title: 'Rapat pleno',
      excerpt: 'Seluruh pengurus wajib hadir.',
      body: '',
      date: '',
      status: 'published',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Tanggal wajib diisi.')
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

  it('rejects empty rich text and non-ImageKit covers', () => {
    const result = validateArticleInput({
      title: 'Berita HMTE',
      slug: 'berita-hmte',
      excerpt: 'Ringkasan berita.',
      content: '<p></p>',
      coverImage: 'https://example.com/cover.jpg',
      category: 'berita-utama',
      status: 'draft',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Isi artikel wajib diisi.')
    expect(result.errors).toContain('URL gambar harus menggunakan HTTPS dari ImageKit.')
  })
})

describe('gallery validation', () => {
  it('allows an incomplete draft but requires image and alt before publish', () => {
    expect(validateGalleryInput({ title: 'Rapat kerja', imageUrl: '', alt: '', caption: '', status: 'draft' }).success).toBe(true)
    const published = validateGalleryInput({ title: 'Rapat kerja', imageUrl: '', alt: '', caption: '', status: 'published' })
    expect(published.success).toBe(false)
    expect(published.errors).toContain('Gambar wajib dipilih sebelum dipublikasikan.')
    expect(published.errors).toContain('Deskripsi gambar wajib diisi sebelum dipublikasikan.')
  })
})
