export type ContentStatus = 'draft' | 'published' | 'archived'

export type ArticleCategoryKey =
  | 'berita-utama'
  | 'prestasi'
  | 'alumni'
  | 'magang'
  | 'proyek-akhir'
  | 'pendidikan'
  | 'penelitian'
  | 'pengabdian'

export type DivisionCode =
  | 'PH'
  | 'KOMINFO'
  | 'IPTEK'
  | 'PSDM'
  | 'PHAL'
  | 'MINKAT'
  | 'KASTRAD'
  | 'KEWIRUS'

export type ArticleTab = {
  key: ArticleCategoryKey
  label: string
}

export type ArticleSummary = {
  image: string
  publisher: string
  publisherIcon: string
  timeAgo: string
  title: string
  excerpt: string
  category: string
  readTime: string
  status?: ContentStatus
  slug?: string
}

export type ArticleGroup = {
  featured: ArticleSummary
  latest: ArticleSummary[]
}

export type Announcement = {
  id: string
  title: string
  excerpt: string
  date: string
  status: ContentStatus
}

export type Division = {
  code: DivisionCode
  name: string
  shortName: string
  description: string
  order: number
}

export type Leader = {
  name: string
  role: string
  photo: string
  batch?: string
  // No studentId here on purpose: NIM is personal data and must never reach a
  // public page, not even unrendered inside a serialized RSC payload.
  origin?: string
  // No email here either, for the same reason as studentId above. It exists on
  // LeaderDocument because the admin panel edits it, but the public shape must
  // not carry it: a field on this type is one line away from being serialized
  // into an RSC payload by a future mapping. Keeping it off the type makes the
  // compiler enforce what a comment could only request.
  instagram?: string
  linkedin?: string
  bio?: string
}

export type ProgramStatus = 'Terjadwal' | 'Berkala'

export type Program = {
  name: string
  desc: string
  /** Pola pelaksanaan, bukan tingkat kepastian tanggal. */
  status: ProgramStatus
  /** Label bulan yang bisa dibaca manusia, mis. "Maret, Juni, September". */
  date: string
  /** Bulan rencana 1-12 dari Buku Panduan. */
  months?: number[]
  /**
   * Tanggal pasti, 'YYYY-MM-DD', diisi pengurus lewat panel saat sudah fix.
   *
   * String ISO, bukan Timestamp: program dijadwalkan pada hari kalender, bukan
   * pada titik waktu. Timestamp membawa jam dan zona waktu yang tidak dimiliki
   * datanya, dan akan menggeser tanggal satu hari saat server berjalan di UTC.
   */
  startDate?: string
  /** Tanggal selesai, 'YYYY-MM-DD'. Kegiatan sehari cukup mengisi startDate. */
  endDate?: string
}

export type NavLink = {
  label: string
  href: string
}

export type NavChild = NavLink

export type NavItem = {
  label: string
  href?: string
  children?: NavChild[]
}

export type GalleryCard = {
  kicker: string
  status: 'confirmed' | 'indicated' | 'pending'
  statusLabel: string
  title: string
  description: string
  href: string
  linkLabel: string
}

export type PartnerTile = {
  label: string
  role: string
}

export type FooterColumn = {
  title: string
  links: NavLink[]
}
