import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Kontak HMTE TRE SV UGM',
  description: 'Kanal resmi HMTE Program Studi Teknologi Rekayasa Elektro Sekolah Vokasi UGM.',
}

export default function ContactPage() {
  return (
    <PublicPageFrame activeHref="/kontak">
      <section className="postal-hero" aria-labelledby="contact-title">
        <div className="postal-airmail" aria-hidden="true" />
        <div className="postal-shell postal-hero-grid">
          <div className="postal-hero-copy">
            <p className="postal-eyebrow">Kanal resmi · Kabinet Abya Vistara</p>
            <h1 id="contact-title">
              Apa kabar?
              <br />
              <em>Ceritakan.</em>
            </h1>
            <p className="postal-lead">
              Temukan kanal HMTE yang tercantum dalam Buku Panduan 2026/2027, atau gunakan formulir
              aspirasi di website untuk menyampaikan masukan kepada pengurus.
            </p>
            <a className="postal-hint" href="#cara-kirim">
              <span>Tiga cara mengirim</span>
              <b aria-hidden="true">↓</b>
            </a>
          </div>

          <div className="postal-hero-card" aria-hidden="true">
            <div className="postcard">
              <p className="postcard-note">
                Untuk Himpunan Mahasiswa Teknik Elektro, Kabinet Abya Vistara.
              </p>
              <i className="postcard-divider" />
              <div className="postcard-address">
                <span>Kepada:</span>
                <b>Program Studi Teknologi Rekayasa Elektro</b>
                <b>Sekolah Vokasi UGM</b>
                <b>Periode 2026/2027</b>
              </div>
              <div className="postcard-stamp">
                <div className="postcard-stamp-inner">
                  <span>HMTE · SV UGM</span>
                  <strong>TRE</strong>
                  <span>Elektro Satu</span>
                </div>
              </div>
              <div className="postcard-postmark">
                <span>
                  Yogyakarta
                  <br />
                  Abya Vistara
                  <br />
                  2026/2027
                </span>
              </div>
              <svg className="postcard-cancel" viewBox="0 0 88 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 4c10-4 18 4 28 0s18 4 28 0 18 4 28 0" />
                <path d="M2 13c10-4 18 4 28 0s18 4 28 0 18 4 28 0" />
                <path d="M2 22c10-4 18 4 28 0s18 4 28 0 18 4 28 0" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="postal-desk" id="cara-kirim" aria-labelledby="channels-title">
        <div className="postal-shell">
          <div className="postal-desk-heading">
            <p className="postal-eyebrow">Pilih jalur kirim</p>
            <h2 id="channels-title">
              Tiga cara agar
              <br />
              pesanmu <em>sampai.</em>
            </h2>
            <p>Dua kanal publik berasal dari buku panduan; formulir aspirasi tersedia sebagai fitur website.</p>
          </div>

          <div className="postal-mail-grid">
            <a className="mail-item mail-postcard" href="https://www.instagram.com/hmteugm" target="_blank" rel="noreferrer">
              <figure>
                <Image
                  src="/assets/robotics_prestige.png"
                  alt="Visual sementara untuk kartu Instagram HMTE"
                  fill
                  sizes="(max-width: 1024px) 100vw, 56vw"
                />
                <figcaption>
                  Salam dari
                  <strong>Elektro!</strong>
                </figcaption>
                <span className="mail-postcard-stamp" aria-hidden="true">
                  <b>IG</b>
                </span>
              </figure>
              <div className="mail-item-meta">
                <span>Kartu pos publik</span>
                <h3>Instagram — @hmteugm</h3>
                <p>Akun Instagram yang tercantum dalam buku panduan. Akun X menggunakan handle yang sama.</p>
                <b>
                  Kunjungi profil <i aria-hidden="true">↗</i>
                </b>
              </div>
            </a>

            <Link className="mail-item mail-envelope" href="/aspirasi">
              <div className="envelope-flap" aria-hidden="true" />
              <span className="envelope-seal" aria-hidden="true">
                TRE
              </span>
              <div className="mail-item-meta">
                <span>Surat tertutup</span>
                <h3>Kanal Aspirasi</h3>
                <p>
                  Gunakan formulir internal website untuk menyampaikan aspirasi akademik, fasilitas,
                  organisasi, atau kesejahteraan, dengan nama atau secara anonim.
                </p>
                <div className="envelope-lines" aria-hidden="true">
                  <span>u.p. Pengurus HMTE</span>
                  <i />
                  <i />
                </div>
                <b>
                  Tulis suratmu <i aria-hidden="true">→</i>
                </b>
              </div>
            </Link>

            <a className="mail-item mail-address" href="https://hmte.ugm.ac.id" target="_blank" rel="noreferrer">
              <div className="mail-address-block">
                <span>Kanal web resmi</span>
                <h3>hmte.ugm.ac.id</h3>
                <p>Website yang tercantum dalam buku panduan. LinkedIn: Himpunan Mahasiswa Teknik Elektro (HMTE) UGM.</p>
              </div>
              <i className="mail-address-route" aria-hidden="true" />
              <div className="mail-address-coords">
                <b>@hmteugm</b>
                <span>
                  Instagram · X
                  <br />
                  Buka situs resmi ↗
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section className="postal-ps" aria-labelledby="ps-title">
        <div className="postal-ps-shell">
          <span className="postal-ps-mark" aria-hidden="true">
            P.S.
          </span>
          <h2 id="ps-title">
            Gunakan kanal yang paling sesuai untuk <em>pesan atau kebutuhanmu.</em>
          </h2>
          <p>Rincian respons dan tindak lanjut dapat dikonfirmasi langsung kepada pengurus melalui kanal resmi.</p>
        </div>
      </section>
    </PublicPageFrame>
  )
}
