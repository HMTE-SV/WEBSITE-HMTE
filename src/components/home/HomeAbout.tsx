'use client'

import Image from 'next/image'
import { useMediaSlot, useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { interpolatePageText } from '@/lib/page-content'

const ABOUT_MEDIA_SLOT_KEYS = Array.from({ length: 5 }, (_, index) => `home.about.${index + 1}`)

// Foto bawaan bila slot media belum diisi admin; urutannya sama dengan slot home.about.1–5.
const FALLBACK_PHOTOS = [
  { src: '/assets/abya-vistara/kegiatan-01.webp', alt: 'Anggota HMTE berinteraksi dalam kegiatan kebersamaan' },
  { src: '/assets/abya-vistara/kabinet-01.webp', alt: 'Foto Kabinet Abya Vistara di halaman kampus UGM' },
  { src: '/assets/abya-vistara/kegiatan-02.webp', alt: 'Barisan anggota HMTE mengikuti permainan kelompok' },
  { src: '/assets/abya-vistara/kabinet-02.webp', alt: 'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan' },
  { src: '/assets/abya-vistara/kegiatan-03.webp', alt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang' },
]

/*
 * Tentang HMTE: judul besar, lalu satu bento. Foto kabinet jadi kotak
 * terbesar dengan cahaya aurora di kakinya; tiga bab (siapa kami, visi,
 * misi) mengisi kotak di sekitarnya dengan ukuran dan isi berbeda.
 */
export function HomeAbout() {
  const { fields } = usePageSection('about')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const slots = useMediaSlots(ABOUT_MEDIA_SLOT_KEYS)
  const photos = FALLBACK_PHOTOS.map((photo, index) => ({
    src: slots[index].url || photo.src,
    alt: slots[index].alt || photo.alt,
    position: `${slots[index].focalPointX}% ${slots[index].focalPointY}%`,
  }))

  const steps = [1, 2, 3].map((number) => ({
    label: fields[`step${number}Label`],
    title: fields[`step${number}Title`],
    body: fields[`step${number}Body`],
  }))
  const chapterPhotos = [[photos[0]], [photos[2]], [photos[3], photos[4]]]
  const group = photos[1]
  const finaleCaption = interpolatePageText(fields.finaleCaption, { period: settings.periodLabel })

  return (
    <section className="av-sec av-about" id="tentang" aria-labelledby="av-about-title">
      <div className="av-frame">
        <header className="av-about-head" data-reveal="">
          <h2 className="av-display" id="av-about-title">
            <span>{fields.titleLine1}</span> <span className="av-display-blue">{fields.titleLine2}</span>
          </h2>
          <div className="av-about-intro">
            <p className="av-lead">{fields.body}</p>
            <p className="av-context">
              {fields.kicker} · {settings.programName} · {settings.facultyName}
            </p>
          </div>
        </header>

        <div className="av-bento">
          <figure className="av-box av-box--photo av-finale" data-reveal="">
            <Image src={group.src} alt={group.alt} fill sizes="(max-width: 900px) 100vw, 720px" style={{ objectPosition: group.position }} />
            <figcaption className="av-finale-caption">
              <Image src={cabinetLogo.url} alt="" width={56} height={56} />
              <span>
                <strong>{fields.finaleLine}</strong>
                {finaleCaption}
              </span>
            </figcaption>
          </figure>

          {steps.map((step, index) => (
            <article className={`av-box av-chapter av-chapter--${index + 1}`} key={`bab-${index + 1}`} data-reveal="" style={{ '--d': `${index * 90}ms` } as React.CSSProperties}>
              <h3>
                <span className="av-chapter-label">{step.label}</span> {step.title}
              </h3>
              <p>{step.body}</p>
              <div className={chapterPhotos[index].length > 1 ? 'av-chapter-media is-pair' : 'av-chapter-media'}>
                {chapterPhotos[index].map((photo) => (
                  <span className="av-photo" key={photo.src}>
                    <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 900px) 92vw, 420px" style={{ objectPosition: photo.position }} />
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
