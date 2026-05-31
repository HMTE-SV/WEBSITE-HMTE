import { slugify } from '../slug'
import type { ArticleCategoryKey, ContentStatus } from '@/types/content'
import type {
  AnnouncementDocument,
  ArticleDocument,
  EventDocument,
  FirestoreCollectionName,
} from '@/types/firestore'

export type ContentKind = 'announcements' | 'events' | 'articles'

export type ContentFormValues = {
  body: string
  category: ArticleCategoryKey | ''
  content: string
  coverImage: string
  date: string
  excerpt: string
  location: string
  slug: string
  status: ContentStatus
  title: string
}

export type ManagedContentDocument = AnnouncementDocument | EventDocument | ArticleDocument

type AnnouncementPayload = Omit<AnnouncementDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
type EventPayload = Omit<EventDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
type ArticlePayload = Omit<ArticleDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>

type ContentCrudConfig = {
  basePath: string
  collectionName: Extract<FirestoreCollectionName, ContentKind>
  description: string
  emptyBody: string
  emptyTitle: string
  kind: ContentKind
  kicker: string
  label: string
  newPath: string
  title: string
}

export const contentCrudConfigs = {
  announcements: {
    basePath: '/admin/announcements',
    collectionName: 'announcements',
    description: 'Kelola pengumuman yang akan tampil di halaman publik.',
    emptyBody: 'Buat pengumuman pertama untuk mulai mengisi kanal informasi resmi HMTE.',
    emptyTitle: 'Belum ada pengumuman.',
    kind: 'announcements',
    kicker: 'Pengumuman',
    label: 'Pengumuman',
    newPath: '/admin/announcements/new',
    title: 'Kelola pengumuman',
  },
  events: {
    basePath: '/admin/events',
    collectionName: 'events',
    description: 'Kelola agenda kegiatan HMTE yang akan tampil di halaman publik.',
    emptyBody: 'Buat agenda pertama agar mahasiswa dapat melihat kegiatan terbaru HMTE.',
    emptyTitle: 'Belum ada agenda.',
    kind: 'events',
    kicker: 'Agenda',
    label: 'Agenda',
    newPath: '/admin/events/new',
    title: 'Kelola agenda',
  },
  articles: {
    basePath: '/admin/articles',
    collectionName: 'articles',
    description: 'Kelola artikel dan berita yang akan tampil di kanal publik.',
    emptyBody: 'Buat berita pertama untuk mulai mengisi kanal publikasi HMTE.',
    emptyTitle: 'Belum ada berita.',
    kind: 'articles',
    kicker: 'Berita',
    label: 'Berita',
    newPath: '/admin/articles/new',
    title: 'Kelola berita',
  },
} as const satisfies Record<ContentKind, ContentCrudConfig>

export function getEmptyContentFormValues(kind: ContentKind): ContentFormValues {
  return {
    body: '',
    category: kind === 'articles' ? 'berita-utama' : '',
    content: '',
    coverImage: '',
    date: '',
    excerpt: '',
    location: '',
    slug: '',
    status: 'draft',
    title: '',
  }
}

export function getNextPublishStatus(status: ContentStatus): ContentStatus {
  return status === 'published' ? 'draft' : 'published'
}

export function buildContentPayload(kind: ContentKind, values: ContentFormValues) {
  const title = values.title.trim()
  const basePayload = {
    title,
    excerpt: values.excerpt.trim(),
    status: values.status,
  }

  if (kind === 'announcements') {
    return {
      ...basePayload,
      body: values.body.trim(),
      date: values.date.trim(),
    } satisfies AnnouncementPayload
  }

  if (kind === 'events') {
    return {
      ...basePayload,
      date: values.date.trim(),
      location: values.location.trim(),
      coverImage: values.coverImage.trim(),
    } satisfies EventPayload
  }

  return {
    ...basePayload,
    category: values.category || 'berita-utama',
    content: values.content.trim(),
    coverImage: values.coverImage.trim(),
    slug: slugify(values.slug || title),
  } satisfies ArticlePayload
}

export function getContentEditPath(kind: ContentKind, id: string) {
  return `${contentCrudConfigs[kind].basePath}/${id}`
}

export function documentToContentFormValues(kind: ContentKind, document: ManagedContentDocument): ContentFormValues {
  const values = getEmptyContentFormValues(kind)

  if (kind === 'announcements') {
    const announcement = document as AnnouncementDocument
    return {
      ...values,
      body: announcement.body || '',
      date: announcement.date,
      excerpt: announcement.excerpt,
      status: announcement.status,
      title: announcement.title,
    }
  }

  if (kind === 'events') {
    const event = document as EventDocument
    return {
      ...values,
      coverImage: event.coverImage || '',
      date: event.date,
      excerpt: event.excerpt,
      location: event.location || '',
      status: event.status,
      title: event.title,
    }
  }

  const article = document as ArticleDocument
  return {
    ...values,
    category: article.category,
    content: article.content,
    coverImage: article.coverImage || '',
    excerpt: article.excerpt,
    slug: article.slug,
    status: article.status,
    title: article.title,
  }
}
