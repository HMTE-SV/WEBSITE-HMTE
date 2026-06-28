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
        <div className="hero-logo-lockup">
          <LogoMark width={390} height={115} className="hero-logo-mark" />
        </div>
        <h1 className="hero-headline">{heroIdentity.name}</h1>
        <p className="hero-tagline">{heroIdentity.tagline}</p>
        <a className="hero-cta-link" href={heroIdentity.ctaHref}>
          {heroIdentity.ctaLabel}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </div>
    </section>
  )
}
