import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { announcements } from '@/data/announcements'

export const metadata: Metadata = {
  title: 'Pengumuman HMTE TRE SV UGM',
  description: 'Pengumuman resmi HMTE TRE SV UGM.',
}

export default function AnnouncementsPage() {
  const publishedAnnouncements = announcements.filter((announcement) => announcement.status === 'published')
  const [latestAnnouncement, ...archiveAnnouncements] = publishedAnnouncements.slice().reverse()

  return (
    <PublicPageFrame activeHref="/pengumuman">
      <section
        className="public-atmosphere-hero has-hero-backdrop"
        aria-labelledby="dispatch-title"
      >
        <HeroBackdrop variant="dome" />
        <div className="atmosphere-shell atmosphere-grid">
          <div className="atmosphere-copy">
            <span className="atmosphere-kicker">Pengumuman resmi</span>
            <h1 id="dispatch-title">Info yang perlu <em>dibaca.</em> Sekarang.</h1>
          </div>
          <aside className="atmosphere-aside">
            <p>Ruang singkat untuk kabar administrasi, kegiatan, dan hal yang perlu ditindaklanjuti oleh mahasiswa TRE.</p>
            <dl className="atmosphere-stats" aria-label="Ringkasan pengumuman">
              <div><dt>Terbit</dt><dd>{String(publishedAnnouncements.length).padStart(2, '0')}</dd></div>
              <div><dt>Status</dt><dd>{publishedAnnouncements.length > 0 ? 'Aktif' : 'Menunggu'}</dd></div>
              <div><dt>Periode</dt><dd>26/27</dd></div>
            </dl>
          </aside>
          <a className="atmosphere-cue" href="#daftar-pengumuman"><span>Gulir untuk membaca</span><b aria-hidden="true">↓</b></a>
        </div>
      </section>

      <section className="dispatch-register" id="daftar-pengumuman" aria-labelledby="register-title">
        <div className="dispatch-shell">
          <div className="dispatch-register-intro">
            <div>
              <p className="dispatch-eyebrow">DAFTAR PEMBARUAN</p>
              <h2 id="register-title">Pembaruan yang <em>diterbitkan.</em></h2>
            </div>
            <p>Disusun dari yang paling baru agar informasi penting tidak tenggelam di antara kabar lain.</p>
          </div>

          {latestAnnouncement ? (
            <article className="dispatch-featured">
              <div className="dispatch-featured-index" aria-hidden="true"><span>01</span><i /></div>
              <div className="dispatch-featured-body">
                <div className="dispatch-item-meta"><span>{latestAnnouncement.date}</span><span>UPDATE UTAMA</span></div>
                <h3>{latestAnnouncement.title}</h3>
                <p>{latestAnnouncement.excerpt}</p>
              </div>
              <div className="dispatch-featured-status"><span><i />TERBIT</span><b aria-hidden="true">↗</b></div>
            </article>
          ) : null}

          {archiveAnnouncements.length > 0 ? (
            <div className="dispatch-archive" aria-label="Arsip pengumuman">
              {archiveAnnouncements.map((announcement, index) => (
                <article className="dispatch-archive-row" key={announcement.id}>
                  <span className="dispatch-archive-index">{String(index + 2).padStart(2, '0')}</span>
                  <div className="dispatch-archive-title"><span>{announcement.date}</span><h3>{announcement.title}</h3></div>
                  <p>{announcement.excerpt}</p>
                  <span className="dispatch-archive-mark" aria-hidden="true">+</span>
                </article>
              ))}
            </div>
          ) : null}

          {!latestAnnouncement ? (
            <EmptyState
              title="Belum ada pengumuman resmi"
              body="Buku Panduan HMTE 2026/2027 tidak memuat pengumuman operasional. Informasi akan tampil setelah tanggal, isi, dan tindak lanjutnya dikonfirmasi pengurus."
            />
          ) : null}
        </div>
      </section>

      <section className="dispatch-afterword" aria-label="Kanal aspirasi mahasiswa">
        <div className="dispatch-shell dispatch-afterword-grid">
          <div className="dispatch-afterword-photo"><Image src="/assets/ugm_socialization.png" alt="Visual sementara untuk ajakan menyampaikan aspirasi" fill sizes="(max-width: 760px) 100vw, 38vw" /></div>
          <div className="dispatch-afterword-copy">
            <p className="dispatch-eyebrow">RUANG LAIN UNTUK DIDENGAR</p>
            <h2>Ada hal yang tidak bisa menunggu pengumuman berikutnya?</h2>
            <p>Untuk masukan akademik, fasilitas, organisasi, atau kesejahteraan, gunakan kanal aspirasi mahasiswa.</p>
            <Link href="/aspirasi">Sampaikan aspirasi <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
