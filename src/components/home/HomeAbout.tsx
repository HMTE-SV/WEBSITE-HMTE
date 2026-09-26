'use client'

import Image from 'next/image'
import { useMediaSlot, useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { interpolatePageText } from '@/lib/page-content'
import { boardImage, DotPhoto } from './HomeMotion'
import { LedBoard } from './LedBoard'

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
 * Tentang HMTE: judul besar, lalu tiga bab berdampingan (triptych) di layar
 * lebar dan bertumpuk di HP. Satu papan saja di seksi ini, di penutupnya:
 * foto kabinet dicetak sebagai titik, lalu nama kabinet menyala di atasnya.
 */
export function HomeAbout() {
  const { fields } = usePageSection('about')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const slots = useMediaSlots(ABOUT_MEDIA_SLOT_KEYS)
  const photos = FALLBACK_PHOTOS.map((photo, index) => ({
    src: slots[index].url || photo.src,
    alt: slots[index].alt || photo.alt,
    focalX: slots[index].focalPointX,
    focalY: slots[index].focalPointY,
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
    <section className="p10-about p10-module" id="tentang" aria-labelledby="p10-about-title">
      <header className="p10-about-head">
        <h2 className="p10-display" id="p10-about-title">
          <span>{fields.titleLine1}</span> <span className="p10-display-soft">{fields.titleLine2}</span>
        </h2>
        <div className="p10-about-intro">
          <p className="p10-lead">{fields.body}</p>
          <p className="p10-context">
            {fields.kicker} · {settings.programName} · {settings.facultyName}
          </p>
        </div>
      </header>

      <ol className="p10-chapters">
        {steps.map((step, index) => (
          <li className={`p10-chapter p10-chapter--${index + 1}`} key={`bab-${index + 1}`}>
            <div className={chapterPhotos[index].length > 1 ? 'p10-chapter-media is-pair' : 'p10-chapter-media'}>
              {chapterPhotos[index].map((photo) => (
                <DotPhoto key={photo.src} src={photo.src} alt={photo.alt} position={photo.position} sizes="(max-width: 900px) 92vw, 380px" />
              ))}
            </div>
            <h3>
              <span className="p10-chapter-label">{step.label}.</span> {step.title}
            </h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="p10-finale">
        <div className="p10-board p10-board--finale">
          <LedBoard
            scenes={[
              { kind: 'boot', duration: 800 },
              { kind: 'image', src: boardImage(group.src), focalX: group.focalX, focalY: group.focalY, hold: 2600 },
              { kind: 'text', text: fields.finaleLine.toUpperCase() },
            ]}
            pitch={5}
            widePitch={8}
            still={2}
            threshold={0.5}
          />
          <p className="sr-only">{group.alt}</p>
        </div>
        <p className="p10-finale-caption">
          <Image src={cabinetLogo.url} alt="" width={40} height={40} />
          <span>
            <strong>{fields.finaleLine}</strong>
            {finaleCaption}
          </span>
        </p>
      </div>
    </section>
  )
}
