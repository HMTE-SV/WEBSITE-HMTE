import { heroIdentity, heroPhotoTiles } from '@/data/site-content'

const heroRows = Array.from({ length: Math.ceil(heroPhotoTiles.length / 8) }, (_, index) =>
  heroPhotoTiles.slice(index * 8, index * 8 + 8),
)

export function Hero() {
  return (
    <section className="tre-hero" id="hero">
      {/* Background photo grid — tamed as a side panel strip */}
      <div className="hero-photo-grid" aria-label="Grid foto kegiatan HMTE">
        {heroRows.map((row, rowIndex) => (
          <div className="hero-grid-row" key={rowIndex}>
            {row.map((tile) => (
              <figure className="photo-tile" aria-label={tile.label} key={tile.label}></figure>
            ))}
          </div>
        ))}
      </div>

      <div className="hero-fade-overlay" aria-hidden="true"></div>

      {/* Editorial asymmetric identity layout */}
      <div className="hero-editorial">
        {/* Left column — eyebrow + giant headline */}
        <div className="hero-left">
          <div className="hero-eyebrow fade-up">
            <span className="hero-index-num">00</span>
            <span className="hero-index-sep" aria-hidden="true"></span>
            <span className="hero-index-label">INDEKS</span>
          </div>
          <h1 className="hero-headline fade-up">
            <span className="hero-hl-line1">{heroIdentity.titleLineOne}</span>
            <span className="hero-hl-line2">{heroIdentity.titleLineTwo}</span>
          </h1>
        </div>

        {/* Right column — colophon metadata block */}
        <aside className="hero-colophon fade-up" aria-label="Identitas organisasi">
          <dl className="hero-meta-list">
            <div className="hero-meta-row">
              <dt>Program</dt>
              <dd>{heroIdentity.program}</dd>
            </div>
            <div className="hero-meta-row">
              <dt>Departemen</dt>
              <dd>{heroIdentity.department}</dd>
            </div>
            <div className="hero-meta-row">
              <dt>Fakultas</dt>
              <dd>{heroIdentity.faculty}</dd>
            </div>
            <div className="hero-meta-row">
              <dt>Universitas</dt>
              <dd>{heroIdentity.university}</dd>
            </div>
          </dl>
          <div className="hero-colophon-rule" aria-hidden="true"></div>
          <p className="hero-colophon-tagline">Elektro — Satu!!!</p>
        </aside>
      </div>

      {/* Decorative vertical line guide */}
      <div className="hero-guide-line" aria-hidden="true"></div>
    </section>
  )
}
