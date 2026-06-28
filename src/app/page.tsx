import { CTA } from '@/components/site/CTA'
import { Footer } from '@/components/site/Footer'
import { Gallery } from '@/components/site/Gallery'
import { Header } from '@/components/site/Header'
import { Hero } from '@/components/site/Hero'
import { NewsAgenda } from '@/components/site/NewsAgenda'
import { OrganizationDirectory } from '@/components/site/OrganizationDirectory'
import { Partners } from '@/components/site/Partners'
import { getOrganizationData } from '@/lib/organization-data'

export default async function Home() {
  const organizationData = await getOrganizationData()

  return (
    <>
      <Hero />
      <div className="landing-nav-stage">
        <Header variant="landing" />
      </div>
      <main id="main-content">
        <NewsAgenda />
        <Gallery />
        <OrganizationDirectory
          divisions={organizationData.divisions}
          divisionsByCode={organizationData.divisionsByCode}
          leadersByDivision={organizationData.leadersByDivision}
          programsByDivision={organizationData.programsByDivision}
        />
        <Partners />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
