'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { createFieldParticles, drawAboutField } from '@/lib/about-field'

/*
 * "Tentang HMTE" untuk HP & mode aplikasi.
 *
 * Di layar lebar seksi ini cerita scroll yang di-pin setinggi 480svh: teks
 * muncul dan memudar mengikuti posisi gulir. Di HP itu berarti enam layar
 * digeser jempol, dan Visi/Misi hanya terbaca kalau jempol berhenti tepat di
 * titiknya. Di sini isinya sama persis (lima bab, lima foto, logo penutup),
 * tapi disusun untuk jempol:
 *
 *   - satu layar, lima bab yang digeser mendatar, masing-masing terbaca
 *     utuh saat diam — tidak ada teks yang setengah pudar;
 *   - tab bab di atas & tombol sebelumnya/berikutnya di bawah, jadi tiap
 *     bab bisa dicapai langsung tanpa menebak jarak geser;
 *   - geraknya tetap: medan partikel yang sama dengan versi desktop
 *     mengerucut ke logo mengikuti posisi geser, foto bergeser paralaks di
 *     bawah jari, judul naik baris demi baris saat babnya tiba.
 */

type DeckPhoto = { src: string; alt: string; position: string }

type AboutDeckProps = {
  identity: string
  orgContext: string
  /** Lima label: pembuka, tiga bab, nama kabinet. */
  chapterLabels: string[]
  prologue: { kicker: string; titleLines: string[]; body: string }
  steps: Array<{ label: string; title: string; body: string }>
  missionWords: string[]
  finale: { line: string; caption: string }
  /** Lima foto urutan PHOTOS di GetToKnow: a, b, c, d, e. */
  photos: DeckPhoto[]
}

const PANEL_COUNT = 5
// Titik cerita desktop yang diwakili tiap bab; bab terakhir jatuh di puncak
// kilatan emas (0,885), jadi logo muncul tepat saat medannya menyala.
const FIELD_TARGETS = [0.05, 0.27, 0.48, 0.66, 0.89]
const FRAME_MS = 1000 / 30

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function DeckPhotoFrame({ photo, className }: { photo: DeckPhoto; className?: string }) {
  return (
    <figure className={className ? `about-deck-photo ${className}` : 'about-deck-photo'}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 86vw, 420px"
        style={{ objectPosition: photo.position }}
      />
    </figure>
  )
}

function RisingLines({ lines, as: Tag }: { lines: string[]; as: 'h2' | 'h3' }) {
  return (
    <Tag className="about-deck-title">
      {lines.map((line, index) => (
        <span className="about-deck-line" key={`${line}-${index}`}>
          <span className="about-deck-line-inner" style={{ '--line': index } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

// Panel dan tab dibaca dari DOM di dalam efek/handler, bukan dari ref yang
// diisi saat render.
const panelsOf = (track: HTMLElement) =>
  Array.from(track.querySelectorAll<HTMLElement>(':scope > .about-deck-panel'))
const tabsOf = (tabs: HTMLElement) => Array.from(tabs.querySelectorAll<HTMLButtonElement>(':scope > button'))

export function AboutDeck({
  identity,
  orgContext,
  chapterLabels,
  prologue,
  steps,
  missionWords,
  finale,
  photos,
}: AboutDeckProps) {
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLElement>(null)
  const activeRef = useRef(0)
  // Target medan partikel, dibaca loop kanvas tanpa memicu render React.
  const fieldTargetRef = useRef(FIELD_TARGETS[0])

  /* ---------- Posisi geser → variabel CSS, tab aktif, target medan ---------- */
  useEffect(() => {
    const track = trackRef.current
    const tabs = tabsRef.current
    if (!track || !tabs) return

    let frame = 0

    function update() {
      frame = 0
      if (!track || !tabs) return
      const panels = panelsOf(track)
      const tabButtons = tabsOf(tabs)
      const first = panels[0]
      const second = panels[1]
      if (!first || !second) return
      const stride = second.offsetLeft - first.offsetLeft || 1
      const pos = Math.min(PANEL_COUNT - 1, Math.max(0, track.scrollLeft / stride))

      panels.forEach((panel, index) => {
        const d = Math.max(-1.5, Math.min(1.5, index - pos))
        panel.style.setProperty('--d', d.toFixed(3))
        panel.style.setProperty('--ad', Math.abs(d).toFixed(3))
      })

      // Tinta tab mengalir di antara dua tab yang sedang dilewati jari.
      const from = Math.floor(pos)
      const to = Math.min(PANEL_COUNT - 1, from + 1)
      const t = pos - from
      const a = tabButtons[from]
      const b = tabButtons[to]
      if (a && b) {
        const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t
        const w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t
        tabs.style.setProperty('--ink-x', `${x.toFixed(1)}px`)
        tabs.style.setProperty('--ink-w', `${w.toFixed(1)}px`)
      }

      const lower = FIELD_TARGETS[from]
      const upper = FIELD_TARGETS[to]
      fieldTargetRef.current = lower + (upper - lower) * t

      const next = Math.round(pos)
      if (next !== activeRef.current) {
        activeRef.current = next
        setActive(next)
      }
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    track.addEventListener('scroll', schedule, { passive: true })
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(track)
    return () => {
      track.removeEventListener('scroll', schedule)
      resizeObserver.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  /* ---------- Tab aktif selalu terlihat di barisnya sendiri ---------- */
  useEffect(() => {
    const tabs = tabsRef.current
    if (!tabs) return
    const tab = tabsOf(tabs)[active]
    if (!tab) return
    const left = tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2
    // scrollTo pada baris tab saja, bukan scrollIntoView: yang terakhir ikut
    // menggulir halaman kalau seksinya belum sepenuhnya di layar.
    tabs.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [active])

  /* ---------- Medan partikel ---------- */
  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = canvas.getContext('2d')
    if (!context) return

    // Penanda gerak: tanpa ini (tanpa JS, atau gerak dikurangi) semua bab
    // tampil diam dan utuh; animasi masuk hanya berlaku di bawah [data-motion].
    root.setAttribute('data-motion', '')

    const particles = createFieldParticles(56)
    let width = 1
    let height = 1
    let dpr = 1
    let raf = 0
    let last = 0
    let p = fieldTargetRef.current

    function resize() {
      if (!root || !canvas) return
      width = Math.max(root.clientWidth, 1)
      height = Math.max(root.clientHeight, 1)
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }

    function loop(now: number) {
      raf = window.requestAnimationFrame(loop)
      // 30 fps cukup untuk gerak lambat ini dan separuh beban baterai.
      if (now - last < FRAME_MS) return
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      p += (fieldTargetRef.current - p) * (1 - Math.exp(-dt * 5))
      if (context) drawAboutField(context, particles, { width, height, dpr, p, time: now * 0.001 })
    }

    function start() {
      if (raf) return
      last = performance.now() - FRAME_MS
      raf = window.requestAnimationFrame(loop)
    }

    function stop() {
      if (!raf) return
      window.cancelAnimationFrame(raf)
      raf = 0
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(root)
    resize()

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) start()
      else stop()
    })
    intersectionObserver.observe(root)

    return () => {
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      root.removeAttribute('data-motion')
    }
  }, [])

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const panels = panelsOf(track)
    const panel = panels[index]
    const first = panels[0]
    if (!panel || !first) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: panel.offsetLeft - first.offsetLeft, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  function handleTabsKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = Math.min(PANEL_COUNT - 1, Math.max(0, active + (event.key === 'ArrowRight' ? 1 : -1)))
    goTo(next)
    if (tabsRef.current) tabsOf(tabsRef.current)[next]?.focus()
  }

  const panelProps = (index: number) => ({
    id: `about-deck-panel-${index}`,
    className: index === active ? 'about-deck-panel is-active' : 'about-deck-panel',
    'aria-roledescription': 'bab',
    'aria-label': `${index + 1} dari ${PANEL_COUNT}: ${chapterLabels[index]}`,
  })

  return (
    <div ref={rootRef} className="about-deck">
      <canvas ref={canvasRef} className="about-deck-canvas" aria-hidden="true" />

      <header className="about-deck-head">
        <strong>{identity}</strong>
        <span>{orgContext}</span>
      </header>

      <nav
        ref={tabsRef}
        className="about-deck-tabs"
        aria-label="Bab Tentang HMTE"
        onKeyDown={handleTabsKeyDown}
      >
        {chapterLabels.map((label, index) => (
          <button
            type="button"
            key={`${label}-${index}`}
            aria-controls={`about-deck-panel-${index}`}
            aria-current={index === active ? 'step' : undefined}
            onClick={() => goTo(index)}
          >
            {label}
          </button>
        ))}
        <span className="about-deck-ink" aria-hidden="true" />
      </nav>

      <div ref={trackRef} className="about-deck-track">
        <article {...panelProps(0)}>
          <DeckPhotoFrame photo={photos[1]} />
          <div className="about-deck-copy">
            <span className="about-deck-kicker">{prologue.kicker}</span>
            <RisingLines lines={prologue.titleLines} as="h2" />
            <p>{prologue.body}</p>
          </div>
        </article>

        {steps.map((step, index) => (
          <article key={`bab-${index + 1}`} {...panelProps(index + 1)}>
            {index === 2 ? (
              <div className="about-deck-pair">
                <DeckPhotoFrame photo={photos[3]} className="is-left" />
                <DeckPhotoFrame photo={photos[4]} className="is-right" />
              </div>
            ) : (
              <DeckPhotoFrame photo={photos[index === 0 ? 0 : 2]} />
            )}
            <div className="about-deck-copy">
              <span className="about-deck-kicker">{step.label}</span>
              <RisingLines lines={index === 2 ? missionWords : [step.title]} as="h3" />
              <p>{step.body}</p>
            </div>
          </article>
        ))}

        <article {...panelProps(4)}>
          <div className="about-deck-finale">
            <div className="about-deck-mark">
              <span className="about-deck-glow" aria-hidden="true" />
              <span className="about-deck-beam" aria-hidden="true" />
              <div className="about-deck-logo">
                <LogoMark width={520} height={154} className="about-deck-logo-img" />
              </div>
            </div>
            <p className="about-deck-chant">{finale.line}</p>
            <p className="about-deck-caption">{finale.caption}</p>
          </div>
        </article>
      </div>

      <div className="about-deck-controls">
        <button
          type="button"
          className="about-deck-step"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Bab sebelumnya"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="about-deck-count" aria-live="polite">
          <b>{pad(active + 1)}</b>
          <span aria-hidden="true"> / {pad(PANEL_COUNT)}</span>
          <span className="sr-only"> dari {PANEL_COUNT}, </span>
          <em>{chapterLabels[active]}</em>
        </p>
        <button
          type="button"
          className="about-deck-step"
          onClick={() => goTo(active + 1)}
          disabled={active === PANEL_COUNT - 1}
          aria-label="Bab berikutnya"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}
