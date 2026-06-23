import { LogoMark } from '@/components/site/Brand'
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
        <div className="hero-logo-lockup" aria-label="HMTE TRE SV UGM">
          <LogoMark width={390} height={115} className="hero-logo-mark" />
        </div>
        <h1 className="identity-program">{heroIdentity.program}</h1>
        <p className="identity-dept">{heroIdentity.department}</p>
        <p className="identity-faculty">{heroIdentity.faculty}</p>
        <p className="identity-univ">{heroIdentity.university}</p>
      </div>
    </section>
  )
}
