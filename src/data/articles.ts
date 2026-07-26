import type { ArticleCategoryKey, ArticleGroup, ArticleTab } from '@/types/content'

export const articleTabs = [
  { key: 'berita-utama', label: 'Berita Utama' },
  { key: 'prestasi', label: 'Prestasi Mahasiswa' },
  { key: 'alumni', label: 'Kabar Alumni' },
  { key: 'magang', label: 'Info Magang' },
  { key: 'proyek-akhir', label: 'Proyek Akhir' },
  { key: 'pendidikan', label: 'Pendidikan' },
  { key: 'penelitian', label: 'Penelitian' },
  { key: 'pengabdian', label: 'Pengabdian' },
] satisfies ArticleTab[]

export const articleCategories: Partial<Record<ArticleCategoryKey, ArticleGroup>> = {}
