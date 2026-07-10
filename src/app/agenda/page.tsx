import type { Metadata } from 'next'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { events } from '@/data/events'

export const metadata: Metadata = {
  title: 'Agenda HMTE TRE SV UGM',
  description: 'Agenda kegiatan HMTE TRE SV UGM.',
}

export default function AgendaPage() {
  const publishedEvents = events.filter((event) => event.status === 'published')

  return (
    <PublicPageFrame activeHref="/agenda">
      <section className="public-atmosphere-hero agenda-atmosphere" aria-labelledby="agenda-title">
        <div className="atmosphere-geometry" aria-hidden="true"><span /><span /><i /></div>
        <div className="atmosphere-shell atmosphere-grid">
          <div className="atmosphere-copy">
            <span className="atmosphere-kicker">Agenda HMTE · 2026</span>
            <h1 id="agenda-title">Waktu, tempat, dan <em>ruang untuk bertemu.</em></h1>
            <p>
              Pantau kegiatan HMTE yang sedang disiapkan dan temukan agenda yang relevan
              untuk diikuti mahasiswa TRE.
            </p>
          </div>
          <aside className="atmosphere-aside">
            <p>Kegiatan terdekat, ruang pertemuan, dan momen penting dalam satu kalender yang mudah diikuti.</p>
            <dl className="atmosphere-stats" aria-label="Ringkasan agenda">
              <div><dt>Agenda</dt><dd>{String(publishedEvents.length).padStart(2, '0')}</dd></div>
              <div><dt>Rentang</dt><dd>Jun—Sep</dd></div>
              <div><dt>Arsip</dt><dd>2026</dd></div>
            </dl>
          </aside>
          <a className="atmosphere-cue" href="#jadwal-agenda"><span>Gulir untuk melihat jadwal</span><b aria-hidden="true">↓</b></a>
        </div>
      </section>

      <section className="agenda-schedule" id="jadwal-agenda" aria-labelledby="agenda-schedule-title">
        <div className="public-shell">
          <div className="agenda-schedule-heading">
            <div>
              <span className="public-label gold">Kalender kegiatan</span>
              <h2 id="agenda-schedule-title">Jadwal HMTE</h2>
            </div>
            <p>Tanggal, lokasi, dan gambaran kegiatan disusun dalam satu alur yang mudah dipindai.</p>
          </div>

          {publishedEvents.length > 0 ? (
            <div className="agenda-timeline">
              {publishedEvents.map((event, index) => (
                <article className="agenda-timeline-item" key={event.id}>
                  <span className="agenda-timeline-number">{String(index + 1).padStart(2, '0')}</span>
                  <time>{event.date}</time>
                  <div className="agenda-timeline-copy">
                    <h3>{event.title}</h3>
                    <p>{event.excerpt}</p>
                  </div>
                  <div className="agenda-timeline-location">
                    <span>Lokasi</span>
                    <strong>{event.location || 'Akan diumumkan'}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Belum ada agenda" body="Agenda resmi akan tampil setelah data dipublikasikan." />
          )}
        </div>
      </section>
    </PublicPageFrame>
  )
}
