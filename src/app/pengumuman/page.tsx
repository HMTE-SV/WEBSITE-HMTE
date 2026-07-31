import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { getPublishedAnnouncements, type PublicAnnouncement } from '@/lib/announcement-data'

/*
 * Jaring pengaman, bukan jalur utama. Lihat komentar `revalidate` di
 * src/app/page.tsx.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Pengumuman HMTE TRE SV UGM',
  description: 'Pengumuman resmi HMTE TRE SV UGM.',
}

/*
 * Papan pengumuman.
 *
 * Versi sebelumnya menampilkan pengumuman terbaru sebagai satu baris besar lalu
 * sisanya sebagai baris arsip bernomor. Dua masalah, dan keduanya soal isi,
 * bukan soal tampilan.
 *
 * Pertama, tidak ada satu pun tanda apakah sebuah pengumuman masih berlaku.
 * Panel meminta pengurus mengisi "tanggal berlaku", lalu halaman publiknya
 * memakai tanggal itu semata-mata untuk mengurutkan. Pendaftaran yang tutup
 * bulan lalu tampil persis sama dengan yang tutup pekan depan.
 *
 * Kedua, field `body` tidak pernah dirender di mana pun. Pengurus mengetik isi
 * pengumuman lengkap di panel, menekan terbit, dan yang sampai ke pembaca cuma
 * ringkasannya. Tidak ada halaman rincian pengumuman, jadi teks itu tidak punya
 * tempat lain untuk muncul.
 *
 * Sekarang tanggal memisahkan papan jadi dua, dan isi lengkapnya bisa dibuka di
 * tempat lewat <details>. Yang masih berlaku tampil lega, yang sudah lewat
 * tampil padat. Bedanya ukuran adalah keterangannya, bukan hiasan.
 */

type BoardState = 'active' | 'archive'

/**
 * Hari ini menurut jam Yogyakarta, bukan menurut jam server.
 *
 * Zona waktunya wajib disebut. Halaman ini dirender di Vercel, yang berjalan di
 * UTC, dan pembacanya ada di WIB. Tanpa penyebutan zona, setiap hari antara
 * pukul 00.00 dan 07.00 WIB server masih mengira hari kemarin, dan batas
 * berlaku/arsip meleset tujuh jam.
 *
 * `en-CA` dipilih karena keluarannya persis 'YYYY-MM-DD', bentuk yang sama
 * dengan yang disimpan pengurus, jadi perbandingannya bisa dilakukan sebagai
 * teks tanpa mengurai apa pun.
 */
function todayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Baris kosong memisahkan paragraf, seperti yang diketik pengurus di panel. */
function toParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function Notice({
  announcement,
  state,
}: {
  announcement: PublicAnnouncement
  state: BoardState
}) {
  const paragraphs = toParagraphs(announcement.body)

  return (
    <article className="pgm-notice" data-state={state}>
      <div className="pgm-date" aria-hidden="true">
        {announcement.dateParts ? (
          <>
            <b>{announcement.dateParts.day}</b>
            <span>{announcement.dateParts.month}</span>
            <small>{announcement.dateParts.year}</small>
          </>
        ) : (
          <span>Tanpa tanggal</span>
        )}
      </div>

      <div className="pgm-notice-body">
        <h3>{announcement.title}</h3>
        <p className="pgm-notice-excerpt">{announcement.excerpt}</p>
        <p className="pgm-notice-date">
          <time dateTime={announcement.dateIso || undefined}>{announcement.dateLabel}</time>
          {state === 'archive' ? <span>Sudah lewat</span> : null}
        </p>

        {paragraphs.length > 0 ? (
          <details className="pgm-detail">
            <summary>
              Isi lengkap
              <b aria-hidden="true">+</b>
            </summary>
            <div>
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </article>
  )
}

export default async function AnnouncementsPage() {
  let announcements: PublicAnnouncement[] = []
  let loadError = false

  try {
    announcements = await getPublishedAnnouncements()
  } catch {
    loadError = true
  }

  const today = todayIso()

  /*
   * Pengumuman tanpa tanggal ikut dianggap masih berlaku. Tidak adanya tanggal
   * berarti tidak ada batas yang pernah dinyatakan, dan menurunkannya ke arsip
   * berarti halaman ini memutuskan sesuatu yang tidak diputuskan pengurus.
   */
  const active = announcements
    .filter((item) => !item.dateIso || item.dateIso >= today)
    // Yang paling dekat lebih dulu. Di daftar hal yang masih berlaku, urutan
    // yang berguna adalah tenggat terdekat, bukan yang terjauh.
    .sort((first, second) => (first.dateIso || '9999-12-31').localeCompare(second.dateIso || '9999-12-31'))

  const archive = announcements
    .filter((item) => item.dateIso && item.dateIso < today)
    .sort((first, second) => second.dateIso.localeCompare(first.dateIso))

  return (
    <PublicPageFrame activeHref="/pengumuman">
      <section className="pgm-hero has-hero-backdrop" aria-labelledby="pgm-title">
        <HeroBackdrop variant="orbit" />
        <div className="soft-shell pgm-hero-inner">
          <p className="pgm-hero-kicker">Pengumuman resmi · Abya Vistara</p>
          <h1 id="pgm-title">
            Yang perlu kamu <span>tahu sekarang.</span>
          </h1>
          <p className="pgm-hero-lead">
            Kabar administrasi, pendaftaran, dan hal yang perlu ditindaklanjuti mahasiswa TRE.
            Papan ini memisahkan yang masih berlaku dari yang sudah lewat, jadi kamu tidak perlu
            menebak sendiri dari tanggalnya.
          </p>

          <dl className="pgm-hero-facts" aria-label="Ringkasan papan pengumuman">
            <div>
              <dt>Masih berlaku</dt>
              <dd>{String(active.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>Sudah lewat</dt>
              <dd>{String(archive.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>Periode</dt>
              <dd>26/27</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="soft-surface" id="daftar-pengumuman">
        <div className="soft-shell">
          {announcements.length === 0 ? (
            <EmptyState
              title={loadError ? 'Pengumuman belum dapat dimuat' : 'Belum ada pengumuman resmi'}
              body={
                loadError
                  ? 'Koneksi ke arsip Firestore sedang bermasalah. Silakan coba kembali beberapa saat lagi.'
                  : 'Pengurus belum menerbitkan pengumuman. Draft yang masih disusun tidak ditampilkan di halaman publik.'
              }
            />
          ) : (
            <>
              <section className="pgm-section" aria-labelledby="active-title">
                <div className="soft-head">
                  <div>
                    <h2 id="active-title">Masih berlaku.</h2>
                    <p className="pgm-subhead">
                      Disusun dari tanggal terdekat, bukan dari yang paling baru diterbitkan.
                    </p>
                  </div>
                </div>

                {active.length > 0 ? (
                  <div className="pgm-board">
                    {active.map((announcement) => (
                      <Notice announcement={announcement} key={announcement.id} state="active" />
                    ))}
                  </div>
                ) : (
                  <div className="soft-empty">
                    <strong>Tidak ada yang sedang berlaku</strong>
                    <p>
                      Semua pengumuman yang pernah terbit sudah lewat tanggalnya. Arsipnya ada di
                      bawah.
                    </p>
                  </div>
                )}
              </section>

              {archive.length > 0 ? (
                <section className="pgm-section" aria-labelledby="archive-title">
                  <div className="soft-head">
                    <div>
                      <h2 id="archive-title">Sudah lewat.</h2>
                      <p className="pgm-subhead">
                        Tetap ditampilkan sebagai catatan. Isi lengkapnya masih bisa dibuka.
                      </p>
                    </div>
                  </div>

                  <div className="pgm-board" data-dense="true">
                    {archive.map((announcement) => (
                      <Notice announcement={announcement} key={announcement.id} state="archive" />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}

          <aside className="pgm-aspirasi">
            <div>
              <h2>Ada yang tidak bisa menunggu pengumuman berikutnya?</h2>
              <p>
                Untuk masukan akademik, fasilitas, organisasi, atau kesejahteraan, gunakan kanal
                aspirasi mahasiswa. Bisa dengan nama, bisa anonim.
              </p>
            </div>
            <Link href="/aspirasi">
              Sampaikan aspirasi <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
    </PublicPageFrame>
  )
}
