import type { Announcement } from '@/types/content'

export const announcements = [
  {
    id: 'validasi-data-pengurus',
    title: 'Validasi Data Pengurus HMTE',
    excerpt:
      'Pengurus diminta menyiapkan data resmi struktur, divisi, kontak, dan program kerja untuk pengisian website.',
    date: 'Mei 2026',
    status: 'published',
  },
  {
    id: 'pengumpulan-arsip-kegiatan',
    title: 'Pengumpulan Arsip Kegiatan dan Galeri',
    excerpt:
      'Dokumentasi kegiatan HMTE dapat dikumpulkan untuk melengkapi halaman galeri dan publikasi organisasi.',
    date: 'Mei 2026',
    status: 'published',
  },
  {
    id: 'kanal-aspirasi-mahasiswa',
    title: 'Persiapan Kanal Aspirasi Mahasiswa',
    excerpt:
      'Kanal aspirasi sedang disiapkan agar mahasiswa TRE dapat menyampaikan masukan secara lebih tertata.',
    date: 'Juni 2026',
    status: 'published',
  },
] satisfies Announcement[]
