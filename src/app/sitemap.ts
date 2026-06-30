import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/content'

const siteUrl = 'https://website-hmte.vercel.app'

const staticRoutes = [
  '',
  '/berita',
  '/agenda',
  '/pengumuman',
  '/program-kerja',
  '/kepengurusan',
  '/divisi',
  '/galeri',
  '/aspirasi',
  '/kontak',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  const articles: MetadataRoute.Sitemap = getAllArticles().map((article) => ({
    url: `${siteUrl}/berita/${article.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...pages, ...articles]
}
