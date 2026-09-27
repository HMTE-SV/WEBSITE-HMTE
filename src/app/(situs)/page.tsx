import type { Metadata } from 'next'
import { Fragment } from 'react'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { PageContentProvider } from '@/components/site/PageContentProvider'
import { HomeAbout } from '@/components/home/HomeAbout'
import { HomeClose } from '@/components/home/HomeClose'
import { HomeHero, HomeNavBadge } from '@/components/home/HomeHero'
import { HomeMomentum } from '@/components/home/HomeMomentum'
import { HomeMotion } from '@/components/home/HomeMotion'
import { HomeNews } from '@/components/home/HomeNews'
import { HomeOrganization } from '@/components/home/HomeOrganization'
import { HomeSectionNav } from '@/components/home/HomeSectionNav'
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
    about: <HomeAbout />,
    news: <HomeNews articles={articles} />,
    organization: <HomeOrganization divisions={organizationData.divisions} divisionsByCode={organizationData.divisionsByCode} leadersByDivision={organizationData.leadersByDivision} programsByDivision={organizationData.programsByDivision} />,
    momentum: <HomeMomentum divisions={organizationData.divisions} leadersByDivision={organizationData.leadersByDivision} programsByDivision={organizationData.programsByDivision} />,
    cta: <HomeClose />,
  } as const
  // Jangkar dan label bilah lompat-seksi HP, mengikuti urutan & visibilitas seksi.
  const jumps = {
    about: { id: 'tentang', label: 'Tentang' },
    news: { id: 'kabar', label: 'Kabar' },
    organization: { id: 'pillars', label: 'Pengurus' },
    momentum: { id: 'hmte-dalam-gerak', label: 'Galeri' },
    cta: { id: 'hubungi', label: 'Kontak' },
  } as const
  const hero = pageContent.sections.find((section) => section.id === 'hero')
  const mainSections = [...pageContent.sections]
    .filter((section) => section.visible && section.id !== 'hero')
    .sort((first, second) => first.order - second.order)

  return (
    <PageContentProvider content={pageContent}>
      {/*
        Beranda = lembar putih bercahaya aurora (css/home-aurora.css). Satu
        versi untuk semua lebar layar; perbedaan HP dan desktop diurus CSS.
      */}
      <div className="av">
        <HomeMotion />
        <div className="landing-nav-stage av-nav-stage">
          <Header variant="landing" aside={<HomeNavBadge />} />
        </div>
        <HomeSectionNav sections={mainSections.flatMap((section) => (section.id in jumps ? [jumps[section.id as keyof typeof jumps]] : []))} />
        {hero?.visible ? <HomeHero articles={articles} /> : null}
        <main id="main-content" className="av-main">
          {mainSections.map((section) => <Fragment key={section.id}>{components[section.id as keyof typeof components]}</Fragment>)}
        </main>
        <Footer />
      </div>
    </PageContentProvider>
  )
}
