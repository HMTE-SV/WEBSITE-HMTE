import type { Metadata } from 'next'
import { Fragment } from 'react'
import { CTA } from '@/components/site/CTA'
import { Footer } from '@/components/site/Footer'
import { GetToKnow } from '@/components/site/GetToKnow'
import { Header } from '@/components/site/Header'
import { Hero } from '@/components/site/Hero'
import { HMTEMomentum } from '@/components/site/HMTEMomentum'
import { NewsAgenda } from '@/components/site/NewsAgenda'
import { OrganizationDirectory } from '@/components/site/OrganizationDirectory'
import { PageContentProvider } from '@/components/site/PageContentProvider'
import { getPublishedArticleFeed, type PublicArticle } from '@/lib/article-data'
import { getOrganizationData } from '@/lib/organization-data'
import { getPageContent } from '@/lib/page-content-data'

/*
 * Jaring pengaman, bukan jalur utama.
 *
 * Jalur normalnya panel memanggil /api/revalidate begitu data berubah, jadi
 * halaman ini segar dalam hitungan detik. Tanpa `revalidate`, halaman ini
 * statis penuh dan panggilan itu jadi SATU-SATUNYA cara menyegarkannya: sekali
 * gagal (token kedaluwarsa, 401, jaringan pengurus putus), halamannya basi
 * sampai deploy berikutnya, bukan sampai lima menit berikutnya.
 */
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent('home')
  return { title: content.seoTitle, description: content.seoDescription }
}

export default async function Home() {
  /*
   * Berita ditangkap errornya, data organisasi tidak.
   *
   * Kalau susunan pengurus gagal dibaca, seluruh beranda memang harus gagal
   * dibangun: menerbitkan struktur organisasi yang salah lebih berbahaya
   * daripada tidak menerbitkan apa-apa. Kalau arsip berita yang bermasalah,
   * beranda tetap berguna, seksi kabarnya tinggal menampilkan keadaan kosong.
   */
  const [organizationData, articles, pageContent] = await Promise.all([
    getOrganizationData(),
    getPublishedArticleFeed().catch((): PublicArticle[] => []),
    getPageContent('home'),
  ])

  const components = {
    about: <GetToKnow />,
    news: <NewsAgenda articles={articles} />,
    organization: <OrganizationDirectory divisions={organizationData.divisions} divisionsByCode={organizationData.divisionsByCode} leadersByDivision={organizationData.leadersByDivision} programsByDivision={organizationData.programsByDivision} />,
    momentum: <HMTEMomentum divisions={organizationData.divisions} leadersByDivision={organizationData.leadersByDivision} programsByDivision={organizationData.programsByDivision} />,
    cta: <CTA />,
  } as const
  const hero = pageContent.sections.find((section) => section.id === 'hero')
  const mainSections = [...pageContent.sections]
    .filter((section) => section.visible && section.id !== 'hero')
    .sort((first, second) => first.order - second.order)

  return (
    <PageContentProvider content={pageContent}>
      {hero?.visible ? <Hero /> : null}
      <div className="landing-nav-stage landing-nav-stage--after-hero">
        <Header variant="landing" />
      </div>
      <main id="main-content">
        {mainSections.map((section) => <Fragment key={section.id}>{components[section.id as keyof typeof components]}</Fragment>)}
      </main>
      <Footer />
    </PageContentProvider>
  )
}
