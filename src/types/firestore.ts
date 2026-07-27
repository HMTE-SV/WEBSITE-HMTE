import type { Timestamp } from 'firebase/firestore'
import type { AdminRole } from './admin'
import type { ArticleCategoryKey, ContentStatus, DivisionCode, ProgramStatus } from './content'

export const firestoreCollections = {
  announcements: 'announcements',
  events: 'events',
  articles: 'articles',
  gallery: 'gallery',
  leaders: 'leaders',
  leaderContacts: 'leaderContacts',
  divisions: 'divisions',
  programs: 'programs',
  partners: 'partners',
  aspirations: 'aspirations',
  adminUsers: 'adminUsers',
  settings: 'settings',
} as const

export type FirestoreCollectionName = (typeof firestoreCollections)[keyof typeof firestoreCollections]

export type FirestoreDocument = {
  id: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type PublishableDocument = FirestoreDocument & {
  status: ContentStatus
  publishedAt?: Timestamp | null
}

export type AnnouncementDocument = PublishableDocument & {
  title: string
  excerpt: string
  body?: string
  date: string
  priority?: number
}

export type EventDocument = PublishableDocument & {
  title: string
  excerpt: string
  date: string
  location?: string
  coverImage?: string
}

export type ArticleDocument = PublishableDocument & {
  title: string
  slug: string
  excerpt: string
  content: string
  category: ArticleCategoryKey
  coverImage?: string
  publisher?: string
  readTime?: string
}

export type GalleryDocument = PublishableDocument & {
  title: string
  imageUrl: string
  alt: string
  caption?: string
  order: number
}

/*
 * Dokumen ini BOLEH DIBACA SIAPA PUN selama `active == true`. Aturan
 * `leaders` di firestore.rules memakai `isActivePublicRecord()`, dan rules
 * Firestore tidak bisa menyaring per-field: begitu sebuah field ada di sini, ia
 * terbaca oleh siapa saja yang memakai config Firebase publik dari bundle klien.
 *
 * Karena itu tidak ada `email`, tidak ada NIM, tidak ada nomor telepon di sini.
 * Kontak pribadi tinggal di `leaderContacts`, yang hanya bisa dibaca admin.
 * `instagram` dan `linkedin` tetap di sini karena keduanya memang akun publik
 * dan ditampilkan di halaman pengurus.
 */
export type LeaderDocument = FirestoreDocument & {
  name: string
  role: string
  divisionCode?: DivisionCode
  photo: string
  batch?: string
  origin?: string
  instagram?: string
  linkedin?: string
  bio?: string
  active: boolean
  order: number
}

/**
 * Kontak pribadi pengurus, terpisah supaya bisa ditutup dari publik.
 *
 * `id` sengaja sama persis dengan id dokumen `leaders` pasangannya, jadi tidak
 * perlu query dan tidak perlu field penghubung. Dokumen yang tidak ada berarti
 * pengurus itu belum mengisi kontak, bukan error.
 */
export type LeaderContactDocument = FirestoreDocument & {
  email: string
  /**
   * Digandakan dari dokumen `leaders` pasangannya. Bukan denormalisasi demi
   * kecepatan: rules Firestore tidak bisa membaca dokumen lain untuk memutuskan,
   * jadi batas wewenang per-bidang harus ada di dokumen yang sedang ditulis.
   */
  divisionCode?: DivisionCode
}

export type DivisionDocument = FirestoreDocument & {
  code: DivisionCode
  name: string
  shortName: string
  description: string
  active: boolean
  order: number
}

export type ProgramDocument = FirestoreDocument & {
  name: string
  desc: string
  divisionCode: DivisionCode
  status: ProgramStatus
  /** Label bulan yang bisa dibaca manusia, mis. "Maret, Juni, September". */
  date: string
  /**
   * Bulan pelaksanaan sebagai angka 1-12. Wajib ikut tersimpan: peta dua belas
   * bulan di /agenda sepenuhnya bergantung pada field ini, dan `date` yang
   * berupa teks bebas tidak bisa diurai balik jadi angka. Tanpa ini, program
   * yang dipindah ke Firestore akan hilang dari halaman agenda.
   */
  months: number[]
  /**
   * Tanggal pasti, 'YYYY-MM-DD'. Opsional: sebagian besar program di Buku
   * Panduan hanya punya bulan rencana, dan memang tidak akan pernah punya
   * tanggal. Lihat `src/lib/program-schedule.ts` untuk alasan memakai string
   * ISO alih-alih Timestamp.
   */
  startDate?: string
  endDate?: string
  active: boolean
  order: number
}

export type PartnerDocument = FirestoreDocument & {
  label: string
  status: string
  url?: string
  active: boolean
  order: number
}

export type AspirationStatus =
  | 'submitted'
  | 'reviewed'
  | 'discussed'
  | 'in_progress'
  | 'resolved'
  | 'archived'

export type AspirationDocument = FirestoreDocument & {
  category: string
  message: string
  senderName?: string
  senderEmail?: string
  isAnonymous: boolean
  status: AspirationStatus
  internalNotes?: string
}

export type AdminUserDocument = FirestoreDocument & {
  uid: string
  email: string
  displayName?: string | null
  role: AdminRole
  active: boolean
}

/**
 * Dokumen tunggal `settings/site`.
 *
 * Sengaja datar, bukan pasangan `{ key, value }` seperti rancangan pertamanya.
 * Bentuk key/value memaksa setiap pembaca menebak isi `value` dan membuat rules
 * mustahil memeriksa apa pun; dengan field bernama, satu tahun agenda yang
 * salah ketik bisa ditolak di tempatnya.
 *
 * Ini satu-satunya dokumen yang boleh dibaca publik di collection `settings`,
 * jadi tidak ada yang bersifat rahasia yang boleh ditambahkan di sini.
 */
export type SiteSettingsDocument = FirestoreDocument & {
  cabinetName: string
  periodLabel: string
  agendaYear: number
  tagline: string
  instagram: string
  email: string
  address: string
  closingCheer: string
  updatedBy?: string
}
