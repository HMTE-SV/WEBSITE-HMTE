import { CTA } from '@/components/site/CTA'
import { Footer } from '@/components/site/Footer'
import { GetToKnow } from '@/components/site/GetToKnow'
import { Header } from '@/components/site/Header'
import { Hero } from '@/components/site/Hero'
import { HMTEMomentum } from '@/components/site/HMTEMomentum'
import { NewsAgenda } from '@/components/site/NewsAgenda'
import { OrganizationDirectory } from '@/components/site/OrganizationDirectory'
import { getOrganizationData } from '@/lib/organization-data'

export default async function Home() {
  const organizationData = await getOrganizationData()

  return (
    <>
      <Hero />
      <div className="landing-nav-stage landing-nav-stage--after-hero">
        <Header variant="landing" />
      </div>
      <main id="main-content">
        <GetToKnow />
        <NewsAgenda />
        <OrganizationDirectory
          divisions={organizationData.divisions}
          divisionsByCode={organizationData.divisionsByCode}
          leadersByDivision={organizationData.leadersByDivision}
          programsByDivision={organizationData.programsByDivision}
        />
        <HMTEMomentum
          divisions={organizationData.divisions}
          leadersByDivision={organizationData.leadersByDivision}
          programsByDivision={organizationData.programsByDivision}
        />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
