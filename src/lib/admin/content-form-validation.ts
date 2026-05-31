import type { ArticleCategoryKey, ContentStatus } from '@/types/content'

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

type EventInput = {
  date: string
  excerpt: string
  location?: string
  status: ContentStatus
  title: string
}

type ArticleInput = {
  category: ArticleCategoryKey | ''
  content: string
  excerpt: string
  slug: string
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
  return validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.date, 'Tanggal wajib diisi.'],
    [input.status, 'Status wajib dipilih.'],
  ])
}

export function validateEventInput(input: EventInput): ValidationResult {
  return validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.date, 'Tanggal wajib diisi.'],
    [input.status, 'Status wajib dipilih.'],
  ])
}

export function validateArticleInput(input: ArticleInput): ValidationResult {
  return validateRequiredFields([
    [input.title, 'Judul wajib diisi.'],
    [input.slug, 'Slug wajib diisi.'],
    [input.excerpt, 'Ringkasan wajib diisi.'],
    [input.content, 'Isi artikel wajib diisi.'],
    [input.category, 'Kategori wajib dipilih.'],
    [input.status, 'Status wajib dipilih.'],
  ])
}
