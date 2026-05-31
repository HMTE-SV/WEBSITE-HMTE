import Link from 'next/link'
import { PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'

export default function NotFound() {
  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="404"
        title="Halaman tidak ditemukan"
        lead="Alamat yang dibuka belum tersedia atau kontennya belum dipublikasikan."
      />
      <PublicSection>
        <Link className="btn btn-secondary" href="/">
          Kembali ke beranda
        </Link>
      </PublicSection>
    </PublicPageFrame>
  )
}
