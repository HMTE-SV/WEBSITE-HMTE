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

export type EventItem = {
  id: string
  title: string
  excerpt: string
  date: string
  location?: string
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
  origin?: string
  email?: string
  instagram?: string
  linkedin?: string
  bio?: string
}

export type ProgramStatus = 'Selesai' | 'Sedang Berjalan' | 'Terencana'

export type Program = {
  name: string
  desc: string
  status: ProgramStatus
  date: string
}

export type NavLink = {
  label: string
  href: string
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
  status: string
}

export type FooterColumn = {
  title: string
  links: NavLink[]
}
