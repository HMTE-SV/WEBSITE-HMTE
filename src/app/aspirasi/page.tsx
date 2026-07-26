import type { Metadata } from 'next'
import Link from 'next/link'
import { AspirationForm } from '@/components/site/AspirationForm'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { PublicPageFrame } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Aspirasi Mahasiswa HMTE TRE SV UGM',
  description: 'Kanal aspirasi mahasiswa TRE SV UGM.',
}

export default function AspirationsPage() {
  return (
    <PublicPageFrame activeHref="/aspirasi">
      <section
        className="aspiration-hero has-hero-backdrop"
        aria-labelledby="aspiration-title"
      >
        <HeroBackdrop variant="arc" />
        <div className="public-shell aspiration-hero-grid">
          <div>
            <span className="aspiration-kicker">Kanal mahasiswa</span>
            <h1 id="aspiration-title">Sampaikan yang perlu didengar.</h1>
            <p>
              Gunakan kanal ini untuk menyampaikan aspirasi akademik, fasilitas, organisasi,
              atau kesejahteraan mahasiswa TRE.
            </p>
          </div>
          <ol className="aspiration-guides" aria-label="Panduan singkat pengiriman aspirasi">
            <li><span>01</span><p>Pilih kategori yang paling sesuai.</p></li>
            <li><span>02</span><p>Tulis konteks aspirasi minimal 20 karakter.</p></li>
            <li><span>03</span><p>Aktifkan mode anonim bila identitas tidak ingin dicantumkan.</p></li>
          </ol>
        </div>
      </section>

      <section className="aspiration-compose" aria-labelledby="aspiration-form-title">
        <div className="public-shell aspiration-compose-grid">
          <div className="aspiration-compose-intro">
            <span className="public-label gold">Ruang aspirasi</span>
            <h2 id="aspiration-form-title">Ceritakan dengan jelas.</h2>
            <p>
              Informasi yang runtut membantu aspirasi dibaca sesuai konteksnya. Kolom nama akan
              dinonaktifkan otomatis saat mode anonim dipilih.
            </p>
            <div className="aspiration-compose-note">
              <span>Butuh kanal lain?</span>
              <p>Temukan kanal komunikasi publik HMTE melalui halaman kontak.</p>
              <Link href="/kontak">Buka halaman kontak <b aria-hidden="true">→</b></Link>
            </div>
          </div>
          <AspirationForm />
        </div>
      </section>
    </PublicPageFrame>
  )
}
