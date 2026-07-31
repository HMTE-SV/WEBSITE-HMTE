import type { ArticleTab } from '@/types/content'

/*
 * Daftar kanal berita. Ini konfigurasi, bukan konten: kategori menentukan tab
 * mana yang boleh dipilih pengurus di panel, dan labelnya dipakai halaman
 * publik. Isi beritanya sendiri seluruhnya dari Firestore.
 */

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
