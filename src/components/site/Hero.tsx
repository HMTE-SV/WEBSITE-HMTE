import { heroIdentity, heroPhotoTiles } from '@/data/site-content'

const heroRows = Array.from({ length: Math.ceil(heroPhotoTiles.length / 8) }, (_, index) =>
  heroPhotoTiles.slice(index * 8, index * 8 + 8),
)

export function Hero() {
  return (
    <section className="tre-hero" id="hero">
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

      <div className="hero-identity">
        <h1 className="identity-primary">
          {heroIdentity.titleLineOne}
          <br />
          {heroIdentity.titleLineTwo}
        </h1>
        <p className="identity-program">{heroIdentity.program}</p>
        <p className="identity-dept">{heroIdentity.department}</p>
        <p className="identity-faculty">{heroIdentity.faculty}</p>
        <p className="identity-univ">{heroIdentity.university}</p>
      </div>
    </section>
  )
}
