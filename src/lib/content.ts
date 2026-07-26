import { articleCategories, articleTabs } from '@/data/articles'
import { slugify } from '@/lib/slug'
import type { ArticleCategoryKey, ArticleSummary } from '@/types/content'

export { slugify } from '@/lib/slug'

export type ArticleListItem = ArticleSummary & {
  categoryKey: ArticleCategoryKey
  categoryLabel: string
  slug: string
}

export function getAllArticles() {
  const slugCounts = new Map<string, number>()
  const categoryLabels = Object.fromEntries(
    articleTabs.map((tab) => [tab.key, tab.label]),
  ) as Record<ArticleCategoryKey, string>

  return Object.entries(articleCategories).flatMap(([categoryKey, group]) => {
    if (!group) return []

    const typedCategoryKey = categoryKey as ArticleCategoryKey
    const articles: ArticleSummary[] = [group.featured, ...group.latest]

    return articles.map((article) => {
      const baseSlug = slugify(article.slug || article.title)
      const count = slugCounts.get(baseSlug) || 0
      slugCounts.set(baseSlug, count + 1)

      return {
        ...article,
        categoryKey: typedCategoryKey,
        categoryLabel: categoryLabels[typedCategoryKey],
        slug: count === 0 ? baseSlug : `${baseSlug}-${count + 1}`,
      } satisfies ArticleListItem
    })
  })
}

export function getArticleBySlug(slug: string) {
  return getAllArticles().find((article) => article.slug === slug)
}
