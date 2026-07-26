import type { Metadata } from 'next'
import { PublicPageFrame } from '@/components/site/PublicPage'
import {
  HeroBackdrop,
  heroBackdropLabels,
  heroBackdropVariants,
} from '@/components/site/HeroBackdrop'

// Internal design board, not part of the public site.
export const metadata: Metadata = {
  title: 'Pratinjau latar hero',
  robots: { index: false, follow: false },
}

export default function BackdropLabPage() {
  return (
    <PublicPageFrame>
      <section className="backdrop-lab" aria-labelledby="backdrop-lab-title">
        <div className="backdrop-lab-shell">
          <header className="backdrop-lab-head">
            <p className="org-context">Papan design · internal</p>
            <h1 id="backdrop-lab-title">Varian latar hero</h1>
            <p>
              Lima benda bercahaya di atas satu medan warna yang sama. Tiap bentuk
              dibangun dari tiga lapis: pita halo lebar yang sangat samar, isi
              bergradasi yang lebih terang di sisi yang menghadap cahaya, dan tepi
              berkilau yang dipalsukan lewat empat sapuan makin lebar makin pudar.
              Bukan garis — permukaan.
            </p>
          </header>

          <div className="backdrop-lab-list">
            {heroBackdropVariants.map((variant) => (
              <figure className="backdrop-lab-item" key={variant}>
                <figcaption>
                  {variant}
                  <span>{heroBackdropLabels[variant]}</span>
                </figcaption>
                <div className="backdrop-lab-frame">
                  <HeroBackdrop variant={variant} />
                  <strong>Elektro... Satu!!!</strong>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
