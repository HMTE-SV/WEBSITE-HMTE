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
import { leadersByDivision } from '@/data/leaders'
import { programsByDivision } from '@/data/programs'
import { readLegacyScript } from '@/lib/legacy-page'
import { LegacyInteractions } from './legacy-interactions'

export default function Home() {
  const legacyScript = readLegacyScript()

  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <NewsAgenda />
        <Gallery />
        <KabinetSection />
        <LeadershipDirectory />
        <Partners />
        <CTA />
      </main>
      <Footer />
      <LegacyInteractions
        script={legacyScript}
        data={{
          newsData: articleCategories,
          kepData: leadersByDivision,
          prokerData: programsByDivision,
        }}
      />
      <MemberDetailModal />
    </>
  )
}
