import Image from 'next/image'
import { galleryIntro, galleryPhotos } from '@/data/site-content'

const cellSizes: Record<string, string> = {
  tall: '(max-width: 760px) 100vw, 46vw',
  wide: '(max-width: 760px) 100vw, 30vw',
  full: '100vw',
}

export function Gallery() {
  return (
    <section className="tre-gallery" id="galeri">
      <div className="gallery-shell">
        <header className="gallery-head fade-up">
          <h2 className="gallery-h2">
            {galleryIntro.title}
            <span className="acc">.</span>
          </h2>
          <p className="gallery-lead">{galleryIntro.lead}</p>
        </header>

        <div className="gallery-bento fade-up">
          {galleryPhotos.map((photo) => (
            <figure className={`bento-cell bento-cell--${photo.span}`} key={photo.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={cellSizes[photo.span] ?? '50vw'}
                className="bento-img"
              />
              <figcaption className="bento-label">{photo.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
