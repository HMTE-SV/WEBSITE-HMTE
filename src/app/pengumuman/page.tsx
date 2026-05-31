import type { Metadata } from 'next'
import { EmptyState, PublicCard, PublicPageFrame, PublicPageHeader, PublicSection } from '@/components/site/PublicPage'
import { announcements } from '@/data/announcements'

export const metadata: Metadata = {
  title: 'Pengumuman HMTE TRE SV UGM',
  description: 'Pengumuman resmi HMTE TRE SV UGM.',
}

export default function AnnouncementsPage() {
  const publishedAnnouncements = announcements.filter((announcement) => announcement.status === 'published')

  return (
    <PublicPageFrame>
      <PublicPageHeader
        kicker="Pengumuman"
        title="Informasi resmi"
        lead="Pengumuman organisasi, administrasi, dan kanal informasi yang perlu diketahui mahasiswa TRE."
      />
      <PublicSection title="Pengumuman terbaru">
        {publishedAnnouncements.length > 0 ? (
          <div className="public-list">
            {publishedAnnouncements.map((announcement) => (
              <PublicCard
                eyebrow={announcement.date}
                title={announcement.title}
                body={announcement.excerpt}
                key={announcement.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada pengumuman"
            body="Pengumuman resmi akan tampil setelah data dipublikasikan."
          />
        )}
      </PublicSection>
    </PublicPageFrame>
  )
}
