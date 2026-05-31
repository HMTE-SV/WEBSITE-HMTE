import Link from 'next/link'
import { articleTabs } from '@/data/articles'
import { newsAgendaIntro } from '@/data/site-content'

export function NewsAgenda() {
  return (
    <section className="tre-news-agenda" id="stats">
      <div className="news-agenda-shell">
        <header className="news-agenda-head">
          <div className="news-agenda-kicker fade-up">
            <span className="s-num">{newsAgendaIntro.sectionNumber}</span>
            <span className="s-line"></span>
            <span>{newsAgendaIntro.kicker}</span>
          </div>
          <div className="fade-up">
            <h2 className="news-agenda-title">
              {newsAgendaIntro.title}
              <span className="acc">.</span>
            </h2>
            <p className="news-agenda-lead">{newsAgendaIntro.lead}</p>
          </div>
        </header>

        <div className="news-tabs-container fade-up">
          <div className="news-tabs-nav" role="tablist" aria-label="Kategori Berita">
            {articleTabs.map((tab, index) => (
              <button
                className={index === 0 ? 'news-tab-btn active' : 'news-tab-btn'}
                role="tab"
                aria-selected={index === 0 ? 'true' : 'false'}
                data-tab={tab.key}
                key={tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="news-featured-container fade-up" id="featuredArticleContainer"></div>

        <div className="news-latest-section fade-up">
          <div className="news-latest-header">
            <h3 className="news-latest-title">Berita Terkini</h3>
            <Link href="/berita" className="news-see-all">
              Lihat Semua{' '}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="news-card-grid" id="latestNewsGrid"></div>
        </div>
      </div>
    </section>
  )
}
