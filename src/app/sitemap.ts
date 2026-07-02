import type { MetadataRoute } from 'next'
import { featuredProgramPresentations } from '@/data/program-presentations'
import { getAllArticles } from '@/lib/content'
import { getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref, getLeaderHref, getProgramHref } from '@/lib/organization-slugs'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [organization] = await Promise.all([getOrganizationData()])
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

  const divisions: MetadataRoute.Sitemap = organization.divisions.map((division) => ({
    url: `${siteUrl}${getDivisionHref(division.code)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.65,
  }))

  const leaders: MetadataRoute.Sitemap = organization.divisions.flatMap((division) =>
    organization.leadersByDivision[division.code].map((leader) => ({
      url: `${siteUrl}${getLeaderHref(leader)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  )

  const featuredPrograms: MetadataRoute.Sitemap = featuredProgramPresentations.map((presentation) => ({
    url: `${siteUrl}${getProgramHref({ name: presentation.programName })}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...pages, ...divisions, ...leaders, ...featuredPrograms, ...articles]
}
