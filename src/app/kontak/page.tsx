import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'

export const metadata: Metadata = {
  title: 'Kontak HMTE TRE SV UGM',
  description: 'Kirim kabar, ide, atau aspirasi ke HMTE TRE SV UGM — kartu pos digital dari Yogyakarta.',
}

export default function ContactPage() {
  return (
    <PublicPageFrame activeHref="/kontak">
      <section className="postal-hero" aria-labelledby="contact-title">
        <div className="postal-airmail" aria-hidden="true" />
        <div className="postal-shell postal-hero-grid">
          <div className="postal-hero-copy">
            <p className="postal-eyebrow">Korespondensi · HMTE TRE SV UGM</p>
            <h1 id="contact-title">
              Apa kabar?
              <br />
              <em>Ceritakan.</em>
            </h1>
            <p className="postal-lead">
              Anggap halaman ini kartu pos yang selalu terbuka: untuk ide, kolaborasi, keluhan yang perlu
              dibenahi, atau sekadar sapaan. Alamatnya sudah kami tuliskan — kamu tinggal mengisi pesannya.
            </p>
            <a className="postal-hint" href="#cara-kirim">
              <span>Tiga cara mengirim</span>
              <b aria-hidden="true">↓</b>
            </a>
          </div>

          <div className="postal-hero-card" aria-hidden="true">
            <div className="postcard">
              <p className="postcard-note">
                Halo! Kabar sekecil apa pun boleh dikirim — kami senang membacanya.
              </p>
              <i className="postcard-divider" />
              <div className="postcard-address">
                <span>Kepada:</span>
                <b>HMTE TRE SV UGM</b>
                <b>Sekolah Vokasi UGM</b>
                <b>Yogyakarta, Indonesia</b>
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
                  55281
                  <br />
                  2026
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
            <p>Tidak semua pesan lewat pintu yang sama — pilih yang paling pas, sisanya kami antarkan.</p>
          </div>

          <div className="postal-mail-grid">
            <a className="mail-item mail-postcard" href="https://www.instagram.com/hmteugm" target="_blank" rel="noreferrer">
              <figure>
                <Image
                  src="/assets/robotics_prestige.png"
                  alt="Tim mahasiswa menyiapkan robot untuk kompetisi robotika"
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
                <p>Dokumentasi kegiatan, pengumuman, dan kabar terbaru. Sapa kami lewat komentar atau DM.</p>
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
                  Akademik, fasilitas, organisasi, atau kesejahteraan — tulis dengan nama atau anonim,
                  semuanya dibaca pengurus.
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

            <article className="mail-item mail-address">
              <div className="mail-address-block">
                <span>Titik temu</span>
                <h3>Sekolah Vokasi UGM</h3>
                <p>Departemen Teknik Elektro dan Informatika, Universitas Gadjah Mada — Yogyakarta.</p>
              </div>
              <i className="mail-address-route" aria-hidden="true" />
              <div className="mail-address-coords">
                <b>7°46&apos; LS — 110°22&apos; BT</b>
                <span>
                  Yogyakarta
                  <br />
                  Indonesia
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="postal-ps" aria-labelledby="ps-title">
        <div className="postal-ps-shell">
          <span className="postal-ps-mark" aria-hidden="true">
            P.S.
          </span>
          <h2 id="ps-title">
            Tidak perlu menunggu alasan besar — <em>satu pesan kecil</em> sudah cukup untuk memulai.
          </h2>
          <p>Kirim lewat jalur mana pun. Kalau ternyata salah alamat, kami yang meneruskannya ke ruang yang tepat.</p>
        </div>
      </section>
    </PublicPageFrame>
  )
}
