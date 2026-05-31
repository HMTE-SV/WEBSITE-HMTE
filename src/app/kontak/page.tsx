import type { Metadata } from 'next'
import { PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Kontak HMTE TRE SV UGM',
  description: 'Kontak dan identitas HMTE TRE SV UGM.',
}

export default function ContactPage() {
  return (
    <PublicPageFrame activeHref="/kontak">
      <PublicPageHeader
        kicker="Kontak"
        title="Hubungi HMTE"
        lead="Identitas organisasi dan kanal kontak yang siap dikonfirmasi bersama pengurus sebelum website dipublikasikan penuh."
      />
      <PublicSection title="Informasi kontak">
        <div className="public-grid">
          <PublicCard
            eyebrow="Instagram"
            title="@hmteugm"
            body="Kanal media sosial publik HMTE TRE SV UGM."
            href="https://www.instagram.com/hmteugm"
          />
          <PublicCard
            eyebrow="Email"
            title="Email resmi"
            body="Alamat email resmi masih perlu dikonfirmasi oleh pengurus sebelum dipasang sebagai kontak publik."
          />
          <PublicCard
            eyebrow="Sekretariat"
            title="Sekolah Vokasi UGM"
            body="Detail sekretariat dan jam layanan akan diisi setelah data resmi dikunci bersama pengurus."
          />
        </div>
      </PublicSection>
    </PublicPageFrame>
  )
}
