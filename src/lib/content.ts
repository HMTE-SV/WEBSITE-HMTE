import type { ArticleCategoryKey, ArticleSummary } from '@/types/content'

export { slugify } from '@/lib/slug'

/*
 * Bentuk satu baris berita di daftar publik.
 *
 * `getAllArticles()` dan `getArticleBySlug()` dulu tinggal di sini, menyusun
 * berita dari src/data/articles.ts. Keduanya sudah dibuang: sumber berita satu-
 * satunya sekarang Firestore lewat src/lib/article-data.ts. Yang tersisa hanya
 * tipenya, karena dipakai bersama oleh feed dan komponennya.
 */
export type ArticleListItem = ArticleSummary & {
  categoryKey: ArticleCategoryKey
  categoryLabel: string
  slug: string
}
