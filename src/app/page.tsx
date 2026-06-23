import { CTA } from '@/components/site/CTA'
import { Footer } from '@/components/site/Footer'
import { Gallery } from '@/components/site/Gallery'
import { Header } from '@/components/site/Header'
import { Hero } from '@/components/site/Hero'
import { KabinetSection } from '@/components/site/KabinetSection'
import { LeadershipDirectory } from '@/components/site/LeadershipDirectory'
import { MemberDetailModal } from '@/components/site/MemberDetailModal'
import { NewsAgenda } from '@/components/site/NewsAgenda'
import { Partners } from '@/components/site/Partners'
import { articleCategories } from '@/data/articles'
import { readLegacyScript } from '@/lib/legacy-page'
import { getOrganizationData } from '@/lib/organization-data'
import { LegacyInteractions } from './legacy-interactions'

export default async function Home() {
  const legacyScript = readLegacyScript()
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
        <KabinetSection divisions={organizationData.divisions} />
        <LeadershipDirectory
          divisionsByCode={organizationData.divisionsByCode}
          leadersByDivision={organizationData.leadersByDivision}
        />
        <Partners />
        <CTA />
      </main>
      <Footer />
      <LegacyInteractions
        script={legacyScript}
        data={{
          newsData: articleCategories,
          kepData: organizationData.leadersByDivision,
          prokerData: organizationData.programsByDivision,
        }}
      />
      <MemberDetailModal />
    </>
  )
}
