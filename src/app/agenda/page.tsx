import type { Metadata } from 'next'
import { EmptyState, PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { events } from '@/data/events'

export const metadata: Metadata = {
  title: 'Agenda HMTE TRE SV UGM',
  description: 'Agenda kegiatan HMTE TRE SV UGM.',
}

export default function AgendaPage() {
  const publishedEvents = events.filter((event) => event.status === 'published')

  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="Agenda"
        title="Agenda kegiatan"
        lead="Daftar kegiatan HMTE yang sedang berjalan dan akan datang. Data ini akan menjadi konten yang dapat dikelola admin."
      />
      <PublicSection title="Agenda HMTE">
        {publishedEvents.length > 0 ? (
          <div className="public-grid">
            {publishedEvents.map((event) => (
              <PublicCard
                eyebrow={event.date}
                title={event.title}
                body={event.excerpt}
                meta={event.location}
                key={event.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada agenda" body="Agenda resmi akan tampil setelah data dipublikasikan." />
        )}
      </PublicSection>
    </PublicPageFrame>
  )
}
