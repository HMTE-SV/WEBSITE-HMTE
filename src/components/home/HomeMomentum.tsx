'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { interpolatePageText } from '@/lib/page-content'
import { formatCabinetTitle } from '@/lib/site-settings'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { ArrowIcon, DotPhoto } from './HomeMotion'
import { LedBoard } from './LedBoard'

type HomeMomentumProps = {
  divisions: Division[]
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

// Foto bawaan bila slot home.moment.1–6 belum diisi admin.
const MOMENTS = [
  { src: '/assets/abya-vistara/kegiatan-01.webp', alt: 'Anggota HMTE berinteraksi dalam kegiatan kebersamaan', label: 'Kebersamaan anggota', shape: 'tall' },
  { src: '/assets/abya-vistara/kabinet-01.webp', alt: 'Foto Kabinet Abya Vistara di halaman kampus UGM', label: 'Kabinet di kampus', shape: 'base' },
  { src: '/assets/abya-vistara/kegiatan-02.webp', alt: 'Barisan anggota HMTE mengikuti permainan kelompok', label: 'Permainan kelompok', shape: 'base' },
  { src: '/assets/abya-vistara/kegiatan-03.webp', alt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang', label: 'Kegiatan luar ruang', shape: 'tall' },
  { src: '/assets/abya-vistara/kabinet-02.webp', alt: 'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan', label: 'Jaket himpunan', shape: 'base' },
  { src: '/assets/abya-vistara/kabinet-03.webp', alt: 'Foto bersama pengurus HMTE periode 2026/2027', label: 'Pengurus 2026/2027', shape: 'grand', position: '50% 30%' },
]
const MOMENT_SLOT_KEYS = MOMENTS.map((_, index) => `home.moment.${index + 1}`)

/** Angka LED yang menghitung naik di dalam kalimat; angkanya tetap ada sebagai teks. */
function LedNumber({ value }: { value: number }) {
  const digits = String(value).length
  return (
    <span className="p10-num" style={{ '--digits': digits } as CSSProperties}>
      <span className="sr-only">{value}</span>
      <span className="p10-board p10-board--num">
        <LedBoard scenes={[{ kind: 'count', to: value, duration: 1300, hold: 0 }]} pitch={3} widePitch={4} still={0} threshold={0.8} />
      </span>
    </span>
  )
}

export function HomeMomentum({ divisions, leadersByDivision, programsByDivision }: HomeMomentumProps) {
  const { fields } = usePageSection('momentum')
  const settings = useSiteSettings()
  const vars = { cabinet: formatCabinetTitle(settings), period: settings.periodLabel }
  const slots = useMediaSlots(MOMENT_SLOT_KEYS)
  const moments = MOMENTS.map((moment, index) => ({
    ...moment,
    src: slots[index].url || moment.src,
    alt: slots[index].alt || moment.alt,
    position: slots[index].isAssigned ? `${slots[index].focalPointX}% ${slots[index].focalPointY}%` : moment.position,
    label: fields[`photoLabel${index + 1}`] || moment.label,
  }))
  const wallRef = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)

  // HP: dinding ini baris geser; titik penanda mengikuti foto yang sedang di depan.
  useEffect(() => {
    const wall = wallRef.current
    if (!wall) return
    let frame = 0
    const update = () => {
      frame = 0
      const tiles = Array.from(wall.children) as HTMLElement[]
      if (tiles.length < 2 || wall.scrollWidth <= wall.clientWidth) return
      const stride = tiles[1].offsetLeft - tiles[0].offsetLeft || 1
      const atEnd = wall.scrollLeft + wall.clientWidth >= wall.scrollWidth - 4
      setCurrent(atEnd ? tiles.length - 1 : Math.round(wall.scrollLeft / stride))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    wall.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      wall.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  function goTo(index: number) {
    const wall = wallRef.current
    const tile = wall?.children[index] as HTMLElement | undefined
    if (!wall || !tile) return
    const first = wall.children[0] as HTMLElement
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    wall.scrollTo({ left: tile.offsetLeft - first.offsetLeft, behavior: smooth ? 'smooth' : 'auto' })
  }

  const members = Object.values(leadersByDivision).flat()
  const programs = Object.values(programsByDivision).flat()

  return (
    <section className="p10-moment p10-module" id="hmte-dalam-gerak" aria-labelledby="p10-moment-title">
      <header className="p10-head">
        <h2 id="p10-moment-title">{fields.title}</h2>
        <Link className="p10-head-action" href="/galeri">
          {fields.galleryAction}
          <ArrowIcon />
        </Link>
        <p className="p10-lead">{interpolatePageText(fields.lead, vars)}</p>
      </header>

      <p className="p10-stats">
        <span>
        {fields.statsIntro} <LedNumber value={divisions.length} /> <strong>{fields.divisionLabel}</strong> dan{' '}
        <LedNumber value={programs.length} /> <strong>{fields.programLabel}</strong>.{' '}
        {members.length > 0 ? (
          <>
            <LedNumber value={members.length} /> {fields.memberLabel}
          </>
        ) : (
          fields.memberEmpty
        )}
        </span>
      </p>

      <ul className="p10-wall" ref={wallRef} aria-label={fields.kicker}>
        {moments.map((moment) => (
          <li className={`p10-tile p10-tile--${moment.shape}`} key={`${moment.src}-${moment.label}`}>
            <DotPhoto src={moment.src} alt={moment.alt} position={moment.position} sizes="(max-width: 900px) 80vw, 420px">
              <figcaption>{moment.label}</figcaption>
            </DotPhoto>
          </li>
        ))}
      </ul>
      <div className="p10-pager" role="group" aria-label={`${fields.kicker}: pilih foto`}>
        {moments.map((moment, index) => (
          <button
            type="button"
            key={`${moment.src}-dot`}
            aria-label={`Foto ${index + 1} dari ${moments.length}: ${moment.label}`}
            aria-current={index === current ? 'true' : undefined}
            onClick={() => goTo(index)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>

      <blockquote className="p10-quote">
        <p>{fields.quote}</p>
        <footer>{interpolatePageText(fields.quoteCaption, vars)}</footer>
      </blockquote>
    </section>
  )
}
