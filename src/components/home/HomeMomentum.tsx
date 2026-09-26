'use client'

import Link from 'next/link'
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

      <ul className="p10-wall" aria-label={fields.kicker}>
        {moments.map((moment) => (
          <li className={`p10-tile p10-tile--${moment.shape}`} key={`${moment.src}-${moment.label}`}>
            <DotPhoto src={moment.src} alt={moment.alt} position={moment.position} sizes="(max-width: 900px) 80vw, 420px">
              <figcaption>{moment.label}</figcaption>
            </DotPhoto>
          </li>
        ))}
      </ul>

      <blockquote className="p10-quote">
        <p>{fields.quote}</p>
        <footer>{interpolatePageText(fields.quoteCaption, vars)}</footer>
      </blockquote>
    </section>
  )
}
