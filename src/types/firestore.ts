import type { Timestamp } from 'firebase/firestore'
import type { AdminRole } from './admin'
import type { ArticleCategoryKey, ContentStatus, DivisionCode, ProgramStatus } from './content'

export const firestoreCollections = {
  announcements: 'announcements',
  events: 'events',
  articles: 'articles',
  gallery: 'gallery',
  leaders: 'leaders',
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

export type LeaderDocument = FirestoreDocument & {
  name: string
  role: string
  divisionCode?: DivisionCode
  photo: string
  batch?: string
  origin?: string
  email?: string
  instagram?: string
  linkedin?: string
  bio?: string
  active: boolean
  order: number
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
  status: ProgramStatus
  date: string
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

export type SiteSettingsDocument = FirestoreDocument & {
  key: string
  value: unknown
  updatedBy?: string
}
