import type { Metadata } from 'next'
import { AspirationForm } from '@/components/site/AspirationForm'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Aspirasi Mahasiswa HMTE TRE SV UGM',
  description: 'Kanal aspirasi mahasiswa TRE SV UGM.',
}

export default function AspirationsPage() {
  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="Aspirasi"
        title="Kanal aspirasi mahasiswa"
        lead="Sampaikan aspirasi akademik, fasilitas, organisasi, atau kesejahteraan mahasiswa. Identitas bisa dikirim anonim."
      />
      <PublicSection title="Form aspirasi">
        <AspirationForm />
      </PublicSection>
    </PublicPageFrame>
  )
}
