import type { MetadataRoute } from 'next'
import { getPublishedArticleFeed } from '@/lib/article-data'
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
  '/galeri',
  '/aspirasi',
  '/kontak',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /*
   * Berita di sitemap dulu diambil dari `getAllArticles()`, yang membaca
   * src/data/articles.ts. Isi file itu objek kosong, jadi setiap berita yang
   * diterbitkan pengurus tidak pernah sekali pun didaftarkan ke mesin pencari.
   * Sitemap-nya lulus semua tes dan tetap salah, karena kosong bukan error.
   */
  const [organization, publishedArticles] = await Promise.all([
    getOrganizationData(),
    getPublishedArticleFeed().catch(() => []),
  ])
  const now = new Date()

  const pages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  const articles: MetadataRoute.Sitemap = publishedArticles.map((article) => ({
    url: `${siteUrl}/berita/${article.slug}`,
    lastModified: article.dateIso ? new Date(article.dateIso) : now,
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

  /*
   * Seluruh program, bukan tiga saja.
   *
   * Daftar ini dulu dibangun dari `featuredProgramPresentations`, konstanta di
   * repo yang isinya cuma TORSI, HMTE Mengajar, dan Elektro Cup. Padahal
   * generateStaticParams() di /program-kerja/[slug] membangkitkan halaman untuk
   * ketiga puluh tujuh program. Akibatnya 34 halaman yang benar-benar terbit
   * tidak pernah didaftarkan ke mesin pencari, dan menandai program baru sebagai
   * sorotan lewat panel tidak akan pernah menambahkannya karena sumbernya bukan
   * Firestore.
   */
  const programs: MetadataRoute.Sitemap = organization.divisions.flatMap((division) =>
    organization.programsByDivision[division.code].map((program) => ({
      url: `${siteUrl}${getProgramHref(program)}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: program.featured ? 0.6 : 0.45,
    })),
  )

  return [...pages, ...divisions, ...leaders, ...programs, ...articles]
}
