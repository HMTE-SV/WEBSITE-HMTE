import { slugify } from '../slug'
import type { ArticleCategoryKey, ContentStatus } from '@/types/content'
import type { PublicDataCategory, PublicDataResource } from '@/lib/public-data'
import type {
  AnnouncementDocument,
  ArticleDocument,
  FirestoreCollectionName,
  PublicDataDocument,
} from '@/types/firestore'

export type ContentKind = 'announcements' | 'articles' | 'publicData'

export type ContentFormValues = {
  body: string
  category: ArticleCategoryKey | ''
  content: string
  coverImage: string
  dataCategory: PublicDataCategory
  date: string
  excerpt: string
  slug: string
  status: ContentStatus
  title: string
  period: string
  publisher: string
  relatedProgram: string
  showArticleMeta: boolean
  showDataMeta: boolean
  resources: PublicDataResource[]
}

export type ManagedContentDocument = AnnouncementDocument | ArticleDocument | PublicDataDocument

type AnnouncementPayload = Omit<AnnouncementDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
type ArticlePayload = Omit<ArticleDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
type PublicDataPayload = Omit<PublicDataDocument, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>

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
  publicData: {
    basePath: '/admin/data',
    collectionName: 'publicData',
    description: 'Terbitkan data mahasiswa, penugasan, spreadsheet, dan berkas publik.',
    emptyBody: 'Buat halaman data pertama untuk mulai membangun pusat informasi bersama.',
    emptyTitle: 'Belum ada data publik.',
    kind: 'publicData',
    kicker: 'Data',
    label: 'Data',
    newPath: '/admin/data/new',
    title: 'Kelola data publik',
  },
} as const satisfies Record<ContentKind, ContentCrudConfig>

export function getEmptyContentFormValues(kind: ContentKind): ContentFormValues {
  return {
    body: '',
    category: kind === 'articles' ? 'berita-utama' : '',
    content: '',
    coverImage: '',
    dataCategory: 'kemahasiswaan',
    date: '',
    excerpt: '',
    slug: '',
    status: 'draft',
    title: '',
    period: '',
    publisher: kind === 'articles' ? 'HMTE TRE SV UGM' : '',
    relatedProgram: '',
    showArticleMeta: true,
    showDataMeta: true,
    resources: [],
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

  if (kind === 'articles') return {
    ...basePayload,
    category: values.category || 'berita-utama',
    content: values.content.trim(),
    coverImage: values.coverImage.trim(),
    publisher: values.publisher.trim(),
    relatedProgram: values.relatedProgram.trim(),
    showArticleMeta: values.showArticleMeta,
    slug: slugify(values.slug || title),
  } satisfies ArticlePayload

  return {
    ...basePayload,
    category: values.dataCategory,
    content: values.content.trim(),
    period: values.period.trim(),
    resources: values.resources,
    showDataMeta: values.showDataMeta,
    slug: slugify(values.slug || title),
  } satisfies PublicDataPayload
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

  if (kind === 'articles') {
    const article = document as ArticleDocument
    return {
      ...values,
      category: article.category,
      content: article.content,
      coverImage: article.coverImage || '',
      excerpt: article.excerpt,
      publisher: article.publisher || 'HMTE TRE SV UGM',
      relatedProgram: article.relatedProgram || '',
      showArticleMeta: article.showArticleMeta !== false,
      slug: article.slug,
      status: article.status,
      title: article.title,
    }
  }

  const data = document as PublicDataDocument
  return {
    ...values,
    content: data.content || '',
    dataCategory: data.category || 'kemahasiswaan',
    excerpt: data.excerpt,
    period: data.period || '',
    resources: data.resources || [],
    showDataMeta: data.showDataMeta !== false,
    slug: data.slug,
    status: data.status,
    title: data.title,
  }
}
