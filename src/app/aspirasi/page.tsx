import type { Metadata } from 'next'
import { EmptyState, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'

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
        lead="Halaman ini disiapkan sebagai rumah aspirasi mahasiswa TRE. Form publik dan alur admin akan dibangun pada fase Aspirasi Mahasiswa."
      />
      <PublicSection>
        <EmptyState
          title="Form aspirasi belum aktif"
          body="Fase berikutnya akan menambahkan form, kategori, status tindak lanjut, dan perlindungan spam sebelum kanal ini dipakai publik."
        />
      </PublicSection>
    </PublicPageFrame>
  )
}
