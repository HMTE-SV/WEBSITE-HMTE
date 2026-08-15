import type { ArticleCategoryKey, ContentStatus } from '@/types/content'
import { validateGalleryImageUrl } from './media-validation'
import { validatePublicDataResources, type PublicDataCategory, type PublicDataResource } from '@/lib/public-data'

type ValidationResult = {
  errors: string[]
  success: boolean
}

type AnnouncementInput = {
  body?: string
  date: string
  excerpt: string
  status: ContentStatus
  title: string
}

type ArticleInput = {
  category: ArticleCategoryKey | ''
  content: string
  coverImage?: string
  excerpt: string
  publisher?: string
  relatedProgram?: string
  slug: string
  status: ContentStatus
  title: string
}

type GalleryInput = {
  alt: string
  caption?: string
  imageUrl: string
  status: ContentStatus
  title: string
}

function validateRequiredFields(fields: Array<[value: string | undefined, message: string]>): ValidationResult {
  const errors = fields.flatMap(([value, message]) => (value?.trim() ? [] : [message]))

  return {
    success: errors.length === 0,
    errors,
  }
}

export function validateAnnouncementInput(input: AnnouncementInput): ValidationResult {
  const result = validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.body?.replace(/<[^>]*>/g, '').replaceAll('&nbsp;', ' '), 'Isi pengumuman wajib diisi.'],
    [input.date, 'Tanggal wajib diisi.'],
    [input.status, 'Status wajib dipilih.'],
  ])

  const errors = [...result.errors]
  if ((input.body?.length ?? 0) > 400_000) errors.push('Isi pengumuman terlalu panjang. Maksimal 400.000 karakter.')

  return { errors, success: errors.length === 0 }
}

type PublicDataInput = {
  content: string
  dataCategory: PublicDataCategory
  excerpt: string
  period: string
  resources: PublicDataResource[]
  slug: string
  status: ContentStatus
  title: string
}

export function validateArticleInput(input: ArticleInput): ValidationResult {
  const result = validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.content.replace(/<[^>]*>/g, '').replaceAll('&nbsp;', ' '), 'Isi artikel wajib diisi.'],
    [input.category, 'Kategori wajib dipilih.'],
    [input.status, 'Status wajib dipilih.'],
  ])

  const errors = [...result.errors]

  if (input.title.trim().length > 180) {
    errors.push('Judul maksimal 180 karakter.')
  }

  if (input.excerpt.trim().length > 320) {
    errors.push('Ringkasan maksimal 320 karakter.')
  }

  if ((input.publisher?.trim().length ?? 0) > 120) {
    errors.push('Nama penerbit maksimal 120 karakter.')
  }

  if ((input.relatedProgram?.trim().length ?? 0) > 180) {
    errors.push('Nama program terkait maksimal 180 karakter.')
  }

  if (input.content.length > 400_000) {
    errors.push('Isi artikel terlalu panjang. Maksimal 400.000 karakter.')
  }

  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    errors.push('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.')
  }

  if (input.slug.length > 120) {
    errors.push('Slug maksimal 120 karakter.')
  }

  if (input.coverImage?.trim()) {
    errors.push(...validateGalleryImageUrl(input.coverImage.trim()).errors)
  }

  return {
    errors,
    success: errors.length === 0,
  }
}

export function validatePublicDataInput(input: PublicDataInput): ValidationResult {
  const result = validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.content.replace(/<[^>]*>/g, '').replaceAll('&nbsp;', ' '), 'Penjelasan data wajib diisi.'],
    [input.dataCategory, 'Kategori data wajib dipilih.'],
    [input.status, 'Status wajib dipilih.'],
  ])
  const errors = [...result.errors, ...validatePublicDataResources(input.resources)]

  if (input.title.trim().length > 180) errors.push('Judul maksimal 180 karakter.')
  if (input.excerpt.trim().length > 320) errors.push('Ringkasan maksimal 320 karakter.')
  if (input.period.trim().length > 80) errors.push('Periode maksimal 80 karakter.')
  if (input.content.length > 400_000) errors.push('Isi halaman terlalu panjang. Maksimal 400.000 karakter.')
  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    errors.push('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.')
  }
  if (input.slug.length > 120) errors.push('Slug maksimal 120 karakter.')

  return { errors, success: errors.length === 0 }
}

export function validateGalleryInput(input: GalleryInput): ValidationResult {
  const errors: string[] = []
  if (!input.title.trim()) errors.push('Judul gambar wajib diisi.')
  if (!input.status) errors.push('Status galeri wajib dipilih.')
  if (input.title.trim().length > 180) errors.push('Judul gambar maksimal 180 karakter.')
  if ((input.caption ?? '').trim().length > 500) errors.push('Caption maksimal 500 karakter.')
  if (input.alt.trim().length > 240) errors.push('Deskripsi gambar maksimal 240 karakter.')

  if (input.status === 'published') {
    if (!input.imageUrl.trim()) errors.push('Gambar wajib dipilih sebelum dipublikasikan.')
    if (!input.alt.trim()) errors.push('Deskripsi gambar wajib diisi sebelum dipublikasikan.')
  }
  if (input.imageUrl.trim()) errors.push(...validateGalleryImageUrl(input.imageUrl.trim()).errors)

  return { errors, success: errors.length === 0 }
}
