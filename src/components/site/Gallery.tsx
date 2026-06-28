import { galleryCards, galleryIntro } from '@/data/site-content'

export function Gallery() {
  return (
    <section className="tre-gallery" id="peta-situs">
      <div className="gallery-shell">
        <header className="gallery-head fade-up">
          <h2 className="gallery-h2">
            {galleryIntro.title}
            <span className="acc">.</span>
          </h2>
        </header>
        <div className="gallery-hub fade-up">
          <div className="hub-control">
            <span className="hub-kicker">{galleryIntro.hubKicker}</span>
            <h3>{galleryIntro.hubTitle}</h3>
            <div className="hub-console">
              {galleryIntro.stats.map((stat) => (
                <div className="hub-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="gallery-grid">
            {galleryCards.map((card) => (
              <a className="gallery-card" href={card.href} key={card.title}>
                <span className="card-kicker">{card.kicker}</span>
                <div>
                  <span className={`status-tag ${card.status}`}>{card.statusLabel}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <span className="card-link">{card.linkLabel}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
