import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Kontak HMTE TRE SV UGM',
  description: 'Kontak dan identitas HMTE TRE SV UGM.',
}

export default function ContactPage() {
  return (
    <PublicPageFrame activeHref="/kontak">
      <section className="contact-switchboard" aria-labelledby="contact-title">
        <div className="contact-switchboard-shell">
          <div className="contact-switchboard-topline"><span>HMTE TRE SV UGM / CONTACT SWITCHBOARD</span><span>03 JALUR TERBUKA</span></div>
          <div className="contact-switchboard-hero">
            <div className="contact-switchboard-copy">
              <p className="contact-switchboard-label"><i aria-hidden="true" />ADA PESAN MASUK</p>
              <h1 id="contact-title">Punya <em>sinyal?</em><br />Kirim ke sini.</h1>
              <p>Untuk kabar, ide, kolaborasi, atau hal yang perlu dibenahi—kami punya beberapa jalur agar pesannya sampai ke ruang yang tepat.</p>
              <a className="contact-switchboard-enter" href="#panel-kontak"><span>Masuk ke panel</span><b aria-hidden="true">↓</b></a>
            </div>
            <div className="contact-switchboard-visual">
              <figure className="contact-switchboard-photo">
                <Image src="/assets/ugm_socialization.png" alt="Mahasiswa dalam sesi pembelajaran" fill priority sizes="(max-width: 760px) 100vw, 40vw" />
                <figcaption><span>RUMAH ORGANISASI</span><span>SV UGM</span></figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-patchbay" id="panel-kontak" aria-labelledby="patchbay-title">
        <div className="contact-switchboard-shell">
          <div className="contact-patchbay-heading">
            <p className="contact-switchboard-label"><i aria-hidden="true" />PANEL KONEKSI</p>
            <h2 id="patchbay-title">Pilih <em>port</em><br />yang paling pas.</h2>
            <p>Setiap pesan tidak perlu masuk lewat pintu yang sama.</p>
          </div>
          <div className="contact-port-grid">
            <a className="contact-port contact-port--public" href="https://www.instagram.com/hmteugm" target="_blank" rel="noreferrer">
              <span className="contact-port-id">PORT / 01</span>
              <div className="contact-port-socket" aria-hidden="true"><i /><i /></div>
              <div className="contact-port-copy"><span>KABAR KE PUBLIK</span><h3>Instagram<br /><em>@hmteugm</em></h3><p>Kegiatan, dokumentasi, dan pembaruan yang siap dibagikan.</p></div>
              <b aria-hidden="true">↗</b>
            </a>
            <Link className="contact-port contact-port--aspirasi" href="/aspirasi">
              <span className="contact-port-id">PORT / 02</span>
              <div className="contact-port-socket" aria-hidden="true"><i /><i /></div>
              <div className="contact-port-copy"><span>UNTUK MAHASISWA</span><h3>Kanal<br /><em>aspirasi.</em></h3><p>Akademik, fasilitas, organisasi, atau kesejahteraan—semua punya tempat untuk dibaca.</p></div>
              <b aria-hidden="true">→</b>
            </Link>
            <article className="contact-port contact-port--base">
              <span className="contact-port-id">PORT / 03</span>
              <div className="contact-port-pin" aria-hidden="true"><i /><span>BASE</span></div>
              <div className="contact-port-copy"><span>TITIK TEMU</span><h3>Sekolah Vokasi<br /><em>UGM.</em></h3><p>Departemen Teknik Elektro dan Informatika, Universitas Gadjah Mada.</p></div>
              <span className="contact-port-coordinates">YOGYAKARTA<br />INDONESIA</span>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-signalfloor" aria-labelledby="signal-floor-title">
        <div className="contact-switchboard-shell contact-signalfloor-grid">
          <div className="contact-signalfloor-line" aria-hidden="true"><span /><i /><span /></div>
          <div className="contact-signalfloor-copy"><p className="contact-switchboard-label"><i aria-hidden="true" />BEBERAPA PESAN DIMULAI KECIL</p><h2 id="signal-floor-title">Tidak perlu menunggu punya alasan yang <em>terlalu besar.</em></h2></div>
          <p className="contact-signalfloor-note">Mulai dari satu pesan. Kami akan membantu mengarahkannya ke ruang yang tepat.</p>
        </div>
      </section>

      <section className="contact-switchboard-signoff" aria-label="Penutup halaman kontak">
        <div className="contact-switchboard-shell"><span>HMTE TRE SV UGM</span><b>ELEKTRO... SATU!!!</b><i aria-hidden="true" /></div>
      </section>
    </PublicPageFrame>
  )
}
