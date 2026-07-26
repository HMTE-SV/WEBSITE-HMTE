'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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

const moments: MomentTile[] = [
  {
    src: '/assets/ugm_socialization.png',
    alt: 'Visual sementara untuk dokumentasi seminar atau sosialisasi HMTE',
    label: 'Seminar / sosialisasi',
    size: 'tall',
    drift: -46,
    rotate: -1.3,
  },
  {
    src: '/assets/robotics_prestige.png',
    alt: 'Visual sementara untuk dokumentasi kompetisi atau pengerjaan karya',
    label: 'Kompetisi / karya',
    size: 'base',
    drift: 34,
    rotate: 1.1,
  },
  {
    src: '/assets/smart_grid_dashboard.png',
    alt: 'Visual sementara untuk dokumentasi riset atau laboratorium',
    label: 'Riset / laboratorium',
    size: 'base',
    drift: -18,
    rotate: -0.7,
  },
  {
    src: '/assets/solar_village.png',
    alt: 'Visual sementara untuk dokumentasi pengabdian atau HMTE Mengajar',
    label: 'Pengabdian / HMTE Mengajar',
    size: 'tall',
    drift: 42,
    rotate: 1.4,
  },
  {
    src: '/assets/semiconductor_career.png',
    alt: 'Visual sementara untuk dokumentasi jejaring atau kunjungan',
    label: 'Jejaring / kunjungan',
    size: 'base',
    drift: -30,
    rotate: -1,
  },
  {
    src: '/assets/ugm_socialization.png',
    alt: 'Visual sementara untuk dokumentasi kebersamaan Kabinet Abya Vistara',
    label: 'Kebersamaan kabinet',
    size: 'grand',
    drift: 22,
    rotate: 0.6,
    position: '50% 30%',
  },
]

export function HMTEMomentum({ divisions, leadersByDivision, programsByDivision }: HMTEMomentumProps) {
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
          <span className="moment-wall-kicker">Ruang dokumentasi</span>
          <h2 id="moment-wall-title">Foto resmi akan menempati ruang ini.</h2>
          <p>
            Visual yang tampil saat ini masih sementara. Dokumentasi aktual Kabinet Abya Vistara
            periode 2026/2027 akan dipasang setelah aset dan izin publikasinya tersedia.
          </p>
        </header>

        <div className="moment-wall-grid">
          {moments.slice(0, 3).map((moment, index) => (
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
            <p>Dokumentasi resmi akan ditempatkan di ruang ini.</p>
            <span>Kabinet Abya Vistara · Periode 2026/2027</span>
          </div>

          {moments.slice(3).map((moment, index) => (
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
            Kabinet ini bergerak melalui <strong>{divisions.length} unsur organisasi</strong> dan{' '}
            <strong>{programs.length} program kerja</strong>.{' '}
            {members.length > 0
              ? `${members.length} nama pengurus telah tercatat.`
              : 'Daftar nama pengurus menunggu data resmi berikutnya.'}
          </p>
          <Link href="/galeri">
            Buka galeri lengkap <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </section>
  )
}
