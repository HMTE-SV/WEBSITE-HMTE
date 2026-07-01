import Image from 'next/image'
import { LogoMark } from '@/components/site/Brand'
import { heroActivityImages, heroIdentity } from '@/data/site-content'

const ROW_COUNT = 4
const TILES_PER_ROW = 8

// Build the ambient marquee rows by cycling the real activity images, offsetting
// each row so vertically adjacent tiles never line up as an obvious repeat.
const heroRows = Array.from({ length: ROW_COUNT }, (_, rowIndex) =>
  Array.from({ length: TILES_PER_ROW }, (_, tileIndex) => {
    const image = heroActivityImages[(rowIndex * 3 + tileIndex) % heroActivityImages.length]
    return { src: image.src, key: `${rowIndex}-${tileIndex}` }
  }),
)

export function Hero() {
  return (
    <section className="tre-hero" id="hero">
      {/* Ambient activity wall: decorative atmosphere behind the HMTE logo. */}
      <div className="hero-photo-grid" aria-hidden="true">
        {heroRows.map((row, rowIndex) => (
          <div className="hero-grid-row" key={rowIndex}>
            {row.map((tile) => (
              <figure className="photo-tile" key={tile.key}>
                <Image
                  src={tile.src}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 45vw, 240px"
                  className="photo-tile-img"
                />
              </figure>
            ))}
          </div>
        ))}
      </div>

      <div className="hero-fade-overlay" aria-hidden="true"></div>

      <div className="hero-identity">
        {/* Visually hidden — keeps a real page <h1> for SEO/accessibility
            now that the logo mark carries the name on screen. */}
        <h1 className="sr-only">{heroIdentity.name}</h1>
        <div className="hero-logo-lockup">
          <LogoMark width={390} height={115} className="hero-logo-mark" />
        </div>
      </div>
    </section>
  )
}
