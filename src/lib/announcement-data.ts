import 'server-only'

import { cache } from 'react'
import { listPublishedAnnouncements } from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { AnnouncementDocument } from '@/types/firestore'

/*
 * Sumber pengumuman untuk halaman publik.
 *
 * Sebelumnya /pengumuman membaca src/data/announcements.ts, yang isinya array
 * kosong dan sudah tidak pernah diisi lagi. Panel admin sementara itu punya menu
 * Pengumuman yang bisa membuat, menerbitkan, dan menghapus dokumen. Dua sistem
 * yang tidak pernah bertemu: pengurus menekan terbit, dan tidak ada yang berubah
 * di situs.
 *
 * Cetakannya mengikuti src/lib/article-data.ts supaya keduanya bisa dibaca
 * berdampingan.
 */

export type PublicAnnouncement = {
  id: string
  title: string
  excerpt: string
  body: string
  /** 'YYYY-MM-DD' seperti yang diisi pengurus, untuk atribut dateTime. */
  dateIso: string
  /** Tanggal berlaku dalam bahasa Indonesia, mis. "5 Agustus 2026". */
  dateLabel: string
  /**
   * Tanggal yang sudah dipecah untuk balok tanggal di papan pengumuman.
   *
   * Dipecah di sini, bukan di komponen, karena penguraian 'YYYY-MM-DD' yang
   * aman zona waktu sudah tinggal di berkas ini. Mengulanginya di halaman
   * adalah cara paling gampang menciptakan pergeseran satu hari yang cuma
   * kelihatan di server yang berjalan di UTC.
   *
   * `null` kalau tanggalnya kosong atau tidak sah. Pengumuman tanpa tanggal
   * tetap sah dan tetap terbit; yang tidak ada cuma baloknya.
   */
  dateParts: { day: string; month: string; year: string } | null
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

function toDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())

  if (!match) return null

  const [, year, month, day] = match
  const monthIndex = Number(month) - 1

  if (monthIndex < 0 || monthIndex > 11) return null

  return { day, month: MONTH_LABELS[monthIndex], year }
}

function formatAnnouncementDate(value: string) {
  /*
   * Tanggal disimpan sebagai 'YYYY-MM-DD' dari <input type="date">, tanpa zona
   * waktu. `new Date('2026-08-05')` ditafsirkan sebagai tengah malam UTC, yang
   * di WIB masih tanggal 5 tapi di zona barat sudah tanggal 4. Menyusun tanggal
   * dari komponennya menghindari pergeseran itu sepenuhnya.
   */
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())

  if (!match) return value.trim() || 'Tanggal belum tersedia'

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  if (Number.isNaN(date.getTime())) return value.trim()

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function toPublicAnnouncement(document: AnnouncementDocument): PublicAnnouncement {
  return {
    body: document.body || '',
    dateIso: document.date || '',
    dateLabel: formatAnnouncementDate(document.date || ''),
    dateParts: toDateParts(document.date || ''),
    excerpt: document.excerpt,
    id: document.id,
    title: document.title,
  }
}

export const getPublishedAnnouncements = cache(async (): Promise<PublicAnnouncement[]> => {
  if (!hasFirebaseConfig()) return []

  const documents = await listPublishedAnnouncements()
  return documents.map(toPublicAnnouncement)
})
