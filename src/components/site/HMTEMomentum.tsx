'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { interpolatePageText } from '@/lib/page-content'
import { formatCabinetTitle } from '@/lib/site-settings'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'

type HMTEMomentumProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

type MomentTile = {
  src: string
  alt: string
  label: string
  size: 'tall' | 'wide' | 'base' | 'grand'
  drift: number
  rotate: number
  position?: string
}

/*
 * Enam bidang dokumentasi kabinet.
 *
 * Sebelumnya isinya lima gambar generatif, satu di antaranya dipakai dua kali,
 * dengan label kategori yang menjanjikan hal-hal yang tidak ada di gambarnya:
 * "Riset / laboratorium", "Kompetisi / karya". Alt textnya bahkan mengaku
 * sendiri sebagai "Visual sementara".
 *
 * Sekarang enam foto asli Kabinet Abya Vistara, dan labelnya menyebut apa yang
 * benar-benar terlihat, bukan kategori kegiatan yang belum terdokumentasi.
 */
const moments: MomentTile[] = [
  {
    src: '/assets/abya-vistara/kegiatan-01.webp',
    alt: 'Anggota HMTE berinteraksi dalam kegiatan kebersamaan',
    label: 'Kebersamaan anggota',
    size: 'tall',
    drift: -46,
    rotate: -1.3,
  },
  {
    src: '/assets/abya-vistara/kabinet-01.webp',
    alt: 'Foto Kabinet Abya Vistara di halaman kampus UGM',
    label: 'Kabinet di kampus',
    size: 'base',
    drift: 34,
    rotate: 1.1,
  },
  {
    src: '/assets/abya-vistara/kegiatan-02.webp',
    alt: 'Barisan anggota HMTE mengikuti permainan kelompok',
    label: 'Permainan kelompok',
    size: 'base',
    drift: -18,
    rotate: -0.7,
  },
  {
    src: '/assets/abya-vistara/kegiatan-03.webp',
    alt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
    label: 'Kegiatan luar ruang',
    size: 'tall',
    drift: 42,
    rotate: 1.4,
  },
  {
    src: '/assets/abya-vistara/kabinet-02.webp',
    alt: 'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan',
    label: 'Jaket himpunan',
    size: 'base',
    drift: -30,
    rotate: -1,
  },
  {
    src: '/assets/abya-vistara/kabinet-03.webp',
    alt: 'Foto bersama pengurus HMTE periode 2026/2027',
    label: 'Pengurus 2026/2027',
    size: 'grand',
    drift: 22,
    rotate: 0.6,
    position: '50% 30%',
  },
]

const MOMENT_MEDIA_SLOT_KEYS = moments.map((_, index) => `home.moment.${index + 1}`)

export function HMTEMomentum({ divisions, leadersByDivision, programsByDivision }: HMTEMomentumProps) {
  const { fields } = usePageSection('momentum')
  const settings = useSiteSettings()
  const textVariables = { cabinet: formatCabinetTitle(settings), period: settings.periodLabel }
  const momentMediaSlots = useMediaSlots(MOMENT_MEDIA_SLOT_KEYS)
  const resolvedMoments = moments.map((moment, index) => ({
    ...moment,
    src: momentMediaSlots[index].url || moment.src,
    alt: momentMediaSlots[index].alt || moment.alt,
    position: momentMediaSlots[index].isAssigned
      ? `${momentMediaSlots[index].focalPointX}% ${momentMediaSlots[index].focalPointY}%`
      : moment.position,
    label: fields[`photoLabel${index + 1}`] || moment.label,
  }))
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const members = Object.values(leadersByDivision).flat()
  const programs = Object.values(programsByDivision).flat()

  // Scroll progress feeds the per-tile parallax drift.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(section)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => observer.disconnect()
    }

    let frame: number | null = null

    function update() {
      frame = null
      if (!section) return
      const rect = section.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total))
      section.style.setProperty('--wall-progress', (progress * 2 - 1).toFixed(4))
    }

    function handleScroll() {
      if (frame === null) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className={isInView ? 'moment-wall is-inview' : 'moment-wall'}
      id="hmte-dalam-gerak"
      aria-labelledby="moment-wall-title"
    >
      <div className="moment-wall-shell">
        <header className="moment-wall-head">
          <span className="moment-wall-kicker">{fields.kicker}</span>
          <h2 id="moment-wall-title">{fields.title}</h2>
          <p>{interpolatePageText(fields.lead, textVariables)}</p>
        </header>

        <div className="moment-wall-grid">
          {resolvedMoments.slice(0, 3).map((moment, index) => (
            <figure
              className={`moment-tile moment-tile--${moment.size}`}
              style={
                {
                  '--drift': `${moment.drift}px`,
                  '--rot': `${moment.rotate}deg`,
                  '--tile-delay': `${index * 110}ms`,
                } as React.CSSProperties
              }
              key={`${moment.src}-${moment.label}`}
            >
              <div className="moment-tile-photo">
                <Image
                  src={moment.src}
                  alt={moment.alt}
                  fill
                  sizes="(max-width: 700px) 82vw, 32vw"
                  style={moment.position ? { objectPosition: moment.position } : undefined}
                />
              </div>
              <figcaption>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {moment.label}
              </figcaption>
            </figure>
          ))}

          <div
            className="moment-tile moment-tile--quote"
            style={{ '--drift': '-24px', '--tile-delay': '330ms' } as React.CSSProperties}
          >
            <p>{fields.quote}</p>
            <span>{interpolatePageText(fields.quoteCaption, textVariables)}</span>
          </div>

          {resolvedMoments.slice(3).map((moment, index) => (
            <figure
              className={`moment-tile moment-tile--${moment.size}`}
              style={
                {
                  '--drift': `${moment.drift}px`,
                  '--rot': `${moment.rotate}deg`,
                  '--tile-delay': `${(index + 4) * 110}ms`,
                } as React.CSSProperties
              }
              key={`${moment.src}-${moment.label}`}
            >
              <div className="moment-tile-photo">
                <Image
                  src={moment.src}
                  alt={moment.alt}
                  fill
                  sizes={moment.size === 'grand' ? '(max-width: 700px) 82vw, 64vw' : '(max-width: 700px) 82vw, 32vw'}
                  style={moment.position ? { objectPosition: moment.position } : undefined}
                />
              </div>
              <figcaption>
                <span>{String(index + 4).padStart(2, '0')}</span>
                {moment.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <footer className="moment-wall-foot">
          <p>
            {fields.statsIntro} <strong>{divisions.length} {fields.divisionLabel}</strong> dan{' '}
            <strong>{programs.length} {fields.programLabel}</strong>.{' '}
            {members.length > 0
              ? `${members.length} ${fields.memberLabel}`
              : fields.memberEmpty}
          </p>
          <Link href="/galeri">
            {fields.galleryAction} <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </section>
  )
}
