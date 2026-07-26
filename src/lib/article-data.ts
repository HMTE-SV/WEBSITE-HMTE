import 'server-only'

import { cache } from 'react'
import { articleTabs } from '@/data/articles'
import { getArticlePlainText, sanitizeArticleContent } from '@/lib/article-content'
import { listPublishedArticles } from '@/lib/firebase/content-services'
import type { ArticleListItem } from '@/lib/content'
import type { ArticleDocument } from '@/types/firestore'

const defaultArticleImage = '/assets/ugm_socialization.png'
const defaultPublisher = 'HMTE TRE SV UGM'

export type PublicArticle = ArticleListItem & {
  contentHtml: string
  dateIso: string
  publishedLabel: string
}

function timestampToDate(value: ArticleDocument['publishedAt'] | ArticleDocument['updatedAt']) {
  if (!value) {
    return null
  }

  return value.toDate()
}

function getReadingTime(content: string) {
  const plainText = getArticlePlainText(content)
  const words = plainText.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} menit baca`
}

function toPublicArticle(document: ArticleDocument): PublicArticle {
  const categoryLabel = articleTabs.find((tab) => tab.key === document.category)?.label ?? 'Berita'
  const publishedDate = timestampToDate(document.publishedAt) ?? timestampToDate(document.updatedAt)
  const publishedLabel = publishedDate
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Makassar',
      }).format(publishedDate)
    : 'Tanggal belum tersedia'

  return {
    category: categoryLabel,
    categoryKey: document.category,
    categoryLabel,
    contentHtml: sanitizeArticleContent(document.content),
    dateIso: publishedDate?.toISOString() ?? '',
    excerpt: document.excerpt,
    image: document.coverImage || defaultArticleImage,
    publisher: document.publisher || defaultPublisher,
    publisherIcon: '/assets/favicon.svg',
    publishedLabel,
    readTime: document.readTime || getReadingTime(document.content),
    slug: document.slug,
    status: document.status,
    timeAgo: publishedLabel,
    title: document.title,
  }
}

export const getPublishedArticleFeed = cache(async () => {
  const documents = await listPublishedArticles()
  return documents.map(toPublicArticle)
})

export const getPublishedArticleBySlug = cache(async (slug: string) => {
  const articles = await getPublishedArticleFeed()
  return articles.find((article) => article.slug === slug) ?? null
})
