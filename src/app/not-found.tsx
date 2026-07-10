import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'

export default function NotFound() {
  return (
    <PublicPageFrame>
      <section className="not-found-page" aria-labelledby="not-found-title">
        <div className="public-shell not-found-layout">
          <div className="not-found-code" aria-hidden="true">404</div>
          <div className="not-found-copy">
            <span>Jalur tidak tersambung</span>
            <h1 id="not-found-title">Halaman ini belum ditemukan.</h1>
            <p>Alamat mungkin berubah, konten belum dipublikasikan, atau tautan sudah tidak berlaku.</p>
            <div>
              <Link className="not-found-primary" href="/">Kembali ke beranda</Link>
              <Link href="/berita">Buka pusat berita</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
