'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AboutDeck } from '@/components/site/AboutDeck'
import { LogoMark } from '@/components/site/Brand'
import { useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { formatCabinetTitle } from '@/lib/site-settings'
import { interpolatePageText } from '@/lib/page-content'
import { createFieldParticles, drawAboutField } from '@/lib/about-field'
import { useStoryMedia } from '@/lib/use-story-media'

type Keyframe = { at: number; x: number; y: number; r: number; s: number; o: number; b: number }

type Chapter = { key: string; label: string; at: number; target: number }

const CHAPTERS: Chapter[] = [
  { key: 'pembuka', label: 'Pembuka', at: 0, target: 0.001 },
  { key: 'siapa', label: 'Siapa kami', at: 0.16, target: 0.29 },
  { key: 'visi', label: 'Visi', at: 0.4, target: 0.53 },
  { key: 'misi', label: 'Misi', at: 0.62, target: 0.74 },
  { key: 'kabinet', label: 'Abya Vistara', at: 0.8, target: 0.965 },
]

const TEXT_WINDOWS = [
  { in0: 0.165, in1: 0.24, out0: 0.345, out1: 0.4 },
  { in0: 0.42, in1: 0.495, out0: 0.565, out1: 0.62 },
  { in0: 0.64, in1: 0.715, out0: 0.765, out1: 0.805 },
]

/*
 * Foto yang melayang di sepanjang bab GetToKnow.
 *
 * Sebelumnya lima gambar generatif dari /assets/*.png, alt textnya sendiri
 * mengaku "Visual sementara untuk ...". Yang dipakai sekarang dokumentasi asli
 * Kabinet Abya Vistara, aset yang sama dengan dinding foto di hero.
 */
type Photo = { src: string; alt: string; variant: string; wide: Keyframe[]; compact: Keyframe[] }

const PHOTOS: Photo[] = [
  {
    src: '/assets/abya-vistara/kegiatan-01.webp',
    alt: 'Anggota HMTE berinteraksi dalam kegiatan kebersamaan',
    variant: 'a',
    wide: [
      { at: 0.0, x: 27, y: 15, r: 7, s: 0.55, o: 0.22, b: 9 },
      { at: 0.17, x: 21, y: 2, r: 2.5, s: 0.96, o: 1, b: 0 },
      { at: 0.36, x: 19, y: -2, r: 0, s: 1.05, o: 1, b: 0 },
      { at: 0.5, x: -12, y: -4, r: -5, s: 0.82, o: 0.3, b: 3 },
      { at: 0.6, x: -40, y: -7, r: -8, s: 0.66, o: 0, b: 7 },
    ],
    compact: [
      { at: 0.0, x: 6, y: -10, r: 5, s: 0.62, o: 0.25, b: 8 },
      { at: 0.17, x: 1, y: -13, r: 2, s: 0.94, o: 1, b: 0 },
      { at: 0.36, x: 0, y: -15, r: 0, s: 1, o: 1, b: 0 },
      { at: 0.5, x: -28, y: -15, r: -6, s: 0.78, o: 0, b: 6 },
    ],
  },
  {
    src: '/assets/abya-vistara/kabinet-01.webp',
    alt: 'Foto Kabinet Abya Vistara di halaman kampus UGM',
    variant: 'b',
    wide: [
      { at: 0.0, x: -28, y: 31, r: -6, s: 0.52, o: 0.16, b: 9 },
      { at: 0.2, x: -26, y: 26, r: -3, s: 0.68, o: 0.5, b: 1 },
      { at: 0.34, x: -25, y: 24, r: -2, s: 0.72, o: 0.55, b: 0 },
      { at: 0.46, x: -29, y: -18, r: 2, s: 0.56, o: 0.32, b: 2 },
      { at: 0.56, x: -31, y: -34, r: 4, s: 0.46, o: 0, b: 7 },
    ],
    compact: [
      { at: 0.0, x: -25, y: -31, r: -5, s: 0.55, o: 0.15, b: 8 },
      { at: 0.2, x: -23, y: -30, r: -2, s: 0.62, o: 0.35, b: 1 },
      { at: 0.34, x: -22, y: -29, r: -1, s: 0.64, o: 0.38, b: 0 },
      { at: 0.5, x: -20, y: -40, r: 2, s: 0.5, o: 0, b: 6 },
    ],
  },
  {
    src: '/assets/abya-vistara/kegiatan-02.webp',
    alt: 'Barisan anggota HMTE mengikuti permainan kelompok',
    variant: 'c',
    wide: [
      { at: 0.3, x: -50, y: 6, r: -4, s: 0.8, o: 0, b: 7 },
      { at: 0.45, x: -21, y: 1, r: -1, s: 1, o: 1, b: 0 },
      { at: 0.58, x: -19, y: -1, r: 0, s: 1.05, o: 1, b: 0 },
      { at: 0.7, x: 0, y: 15, r: 0, s: 0.52, o: 0.9, b: 0 },
      { at: 0.8, x: 0, y: 13, r: 0, s: 0.48, o: 0.85, b: 0 },
      { at: 0.9, x: 0, y: 2, r: 0, s: 0.12, o: 0, b: 9 },
    ],
    compact: [
      { at: 0.32, x: 34, y: -16, r: 3, s: 0.8, o: 0, b: 6 },
      { at: 0.46, x: 1, y: -16, r: 0, s: 1, o: 1, b: 0 },
      { at: 0.58, x: 0, y: -17, r: 0, s: 1.04, o: 1, b: 0 },
      { at: 0.7, x: 0, y: -15, r: 0, s: 0.62, o: 0.9, b: 0 },
      { at: 0.8, x: 0, y: -13, r: 0, s: 0.56, o: 0.85, b: 0 },
      { at: 0.9, x: 0, y: -2, r: 0, s: 0.14, o: 0, b: 8 },
    ],
  },
  {
    src: '/assets/abya-vistara/kabinet-02.webp',
    alt: 'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan',
    variant: 'd',
    wide: [
      { at: 0.58, x: -30, y: 44, r: -7, s: 0.44, o: 0, b: 7 },
      { at: 0.7, x: -23, y: 16, r: -2.5, s: 0.54, o: 0.85, b: 0 },
      { at: 0.8, x: -22, y: 14, r: -2, s: 0.5, o: 0.8, b: 0 },
      { at: 0.9, x: -1, y: 2, r: 0, s: 0.12, o: 0, b: 9 },
    ],
    compact: [
      { at: 0.58, x: -30, y: -34, r: -6, s: 0.46, o: 0, b: 6 },
      { at: 0.7, x: -26, y: -16, r: -2, s: 0.52, o: 0.85, b: 0 },
      { at: 0.8, x: -25, y: -15, r: -2, s: 0.5, o: 0.8, b: 0 },
      { at: 0.9, x: -1, y: -2, r: 0, s: 0.12, o: 0, b: 8 },
    ],
  },
  {
    src: '/assets/abya-vistara/kegiatan-03.webp',
    alt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
    variant: 'e',
    wide: [
      { at: 0.58, x: 30, y: 44, r: 7, s: 0.44, o: 0, b: 7 },
      { at: 0.7, x: 23, y: 16, r: 2.5, s: 0.54, o: 0.85, b: 0 },
      { at: 0.8, x: 22, y: 14, r: 2, s: 0.5, o: 0.8, b: 0 },
      { at: 0.9, x: 1, y: 2, r: 0, s: 0.12, o: 0, b: 9 },
    ],
    compact: [
      { at: 0.58, x: 30, y: -34, r: 6, s: 0.46, o: 0, b: 6 },
      { at: 0.7, x: 26, y: -16, r: 2, s: 0.52, o: 0.85, b: 0 },
      { at: 0.8, x: 25, y: -15, r: 2, s: 0.5, o: 0.8, b: 0 },
      { at: 0.9, x: 1, y: -2, r: 0, s: 0.12, o: 0, b: 8 },
    ],
  },
]

const ABOUT_MEDIA_SLOT_KEYS = PHOTOS.map((_, index) => `home.about.${index + 1}`)

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const seg = (p: number, from: number, to: number) => clamp01((p - from) / (to - from))
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const bell = (p: number, center: number, width: number) => Math.exp(-((p - center) ** 2) / (2 * width * width))

function sampleTimeline(frames: Keyframe[], p: number): Keyframe {
  if (p <= frames[0].at) return frames[0]
  const last = frames[frames.length - 1]
  if (p >= last.at) return last
  let index = 0
  while (frames[index + 1].at < p) index += 1
  const a = frames[index]
  const b = frames[index + 1]
  const t = (p - a.at) / (b.at - a.at)
  const e = t * t * (3 - 2 * t)
  const mix = (u: number, v: number) => u + (v - u) * e
  return { at: p, x: mix(a.x, b.x), y: mix(a.y, b.y), r: mix(a.r, b.r), s: mix(a.s, b.s), o: mix(a.o, b.o), b: mix(a.b, b.b) }
}

function splitSentences(title: string) {
  return title.split('. ').map((part, index, parts) => (index < parts.length - 1 ? `${part}.` : part))
}

export function GetToKnow() {
  const settings = useSiteSettings()
  const { fields } = usePageSection('about')
  const aboutMediaSlots = useMediaSlots(ABOUT_MEDIA_SLOT_KEYS)
  const [activeChapter, setActiveChapter] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoRefs = useRef<Array<HTMLElement | null>>([])
  const prologRef = useRef<HTMLDivElement>(null)
  const prologKickerRef = useRef<HTMLSpanElement>(null)
  const prologBodyRef = useRef<HTMLParagraphElement>(null)
  const prologLineRefs = useRef<Array<HTMLSpanElement | null>>([])
  const chapterRefs = useRef<Array<HTMLElement | null>>([])
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([])
  const finaleRef = useRef<HTMLDivElement>(null)
  const beamRef = useRef<HTMLSpanElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const chantRef = useRef<HTMLParagraphElement>(null)
  const captionRef = useRef<HTMLParagraphElement>(null)
  const railFillRef = useRef<HTMLElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)

  // Cerita scroll hanya milik layar lebar di browser. Di HP & mode aplikasi
  // yang tampil AboutDeck, jadi panggung ini tidak dipasang sama sekali:
  // tanpa [data-ready], seksi tidak setinggi 480svh dan tidak ada rAF.
  const storyActive = useStoryMedia()

  useEffect(() => {
    if (!storyActive) return
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = canvas.getContext('2d')
    if (!context) return

    section.setAttribute('data-ready', '')

    const finePointer = window.matchMedia('(pointer: fine)').matches
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    let stageW = 1
    let stageH = 1
    let compact = false
    let dpr = 1
    let rafId = 0
    let lastTime = 0
    let smooth = -1
    let chapterIndex = -1

    const particles = createFieldParticles(96)

    function resize() {
      if (!stage || !canvas) return
      stageW = Math.max(stage.clientWidth, 1)
      stageH = Math.max(stage.clientHeight, 1)
      compact = stageW < 880
      dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      canvas.width = Math.round(stageW * dpr)
      canvas.height = Math.round(stageH * dpr)
    }

    function drawField(p: number, time: number) {
      if (!context) return
      drawAboutField(context, particles, {
        width: stageW,
        height: stageH,
        dpr,
        p,
        time,
        pointerX: pointer.x,
        pointerY: pointer.y,
      })
    }

    function render(p: number, time: number) {
      photoRefs.current.forEach((el, index) => {
        if (!el) return
        const frame = sampleTimeline(compact ? PHOTOS[index].compact : PHOTOS[index].wide, p)
        const depth = (1 - Math.min(frame.s, 1)) * 26 + 6
        const tx = (frame.x / 100) * stageW + pointer.x * depth
        const ty = (frame.y / 100) * stageH + pointer.y * depth * 0.6
        el.style.opacity = frame.o.toFixed(3)
        el.style.transform = `translate(-50%, -50%) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${frame.r.toFixed(2)}deg) scale(${frame.s.toFixed(3)})`
        el.style.filter = frame.b > 0.15 ? `blur(${frame.b.toFixed(1)}px)` : ''
        el.style.visibility = frame.o < 0.004 ? 'hidden' : 'visible'
      })

      const prolog = prologRef.current
      if (prolog) {
        const gone = p > 0.18
        prolog.style.visibility = gone ? 'hidden' : 'visible'
        if (!gone) {
          const kicker = prologKickerRef.current
          if (kicker) {
            const t = easeInOutCubic(seg(p, 0.015, 0.1))
            kicker.style.opacity = String(1 - t)
            kicker.style.transform = `translate3d(0, ${(-18 * t).toFixed(1)}px, 0)`
          }
          prologLineRefs.current.forEach((inner, index) => {
            if (!inner) return
            const t = easeInOutCubic(seg(p, 0.025 + index * 0.02, 0.13 + index * 0.02))
            inner.style.transform = `translate3d(0, ${(-110 * t).toFixed(2)}%, 0)`
          })
          const body = prologBodyRef.current
          if (body) {
            const t = seg(p, 0.04, 0.115)
            body.style.opacity = String(1 - t)
            body.style.transform = `translate3d(0, ${(-22 * t).toFixed(1)}px, 0)`
          }
        }
      }

      TEXT_WINDOWS.forEach((win, chapter) => {
        const el = chapterRefs.current[chapter]
        if (!el) return
        const active = p > win.in0 - 0.03 && p < win.out1 + 0.02
        el.style.visibility = active ? 'visible' : 'hidden'
        if (!active) return
        Array.from(el.children).forEach((node, index) => {
          if (!(node instanceof HTMLElement)) return
          const delay = index * 0.014
          const tIn = easeOutQuart(seg(p, win.in0 + delay, win.in1 + delay))
          const tOut = easeInOutCubic(seg(p, win.out0 + delay, win.out1 + delay))
          node.style.opacity = (tIn * (1 - tOut)).toFixed(3)
          node.style.transform = `translate3d(0, ${((1 - tIn) * 48 - tOut * 44).toFixed(1)}px, 0)`
        })
      })

      wordRefs.current.forEach((inner, index) => {
        if (!inner) return
        const t = easeOutQuart(seg(p, 0.652 + index * 0.02, 0.72 + index * 0.02))
        inner.style.transform = `translate3d(0, ${((1 - t) * 108).toFixed(2)}%, 0)`
      })

      const finale = finaleRef.current
      if (finale) {
        const show = p > 0.76
        finale.style.visibility = show ? 'visible' : 'hidden'
        if (show) {
          const flare = bell(p, 0.885, 0.07)
          const beam = beamRef.current
          if (beam) {
            const grow = easeOutQuart(seg(p, 0.78, 0.84))
            const fade = seg(p, 0.85, 0.9)
            beam.style.opacity = (grow * (1 - fade)).toFixed(3)
            beam.style.transform = `translate(-50%, -50%) scaleY(${grow.toFixed(3)})`
          }
          const logo = logoRef.current
          if (logo) {
            const reveal = easeInOutCubic(seg(p, 0.82, 0.91))
            const inset = (50 * (1 - reveal)).toFixed(2)
            logo.style.opacity = seg(p, 0.82, 0.86).toFixed(3)
            logo.style.clipPath = `inset(0 ${inset}% 0 ${inset}%)`
            logo.style.filter = reveal < 0.999 ? `blur(${((1 - reveal) * 10).toFixed(1)}px)` : ''
            logo.style.transform = `translate3d(0, ${((1 - reveal) * 12).toFixed(1)}px, 0) scale(${(0.88 + reveal * 0.12).toFixed(3)})`
          }
          const glow = glowRef.current
          if (glow) {
            const rest = seg(p, 0.9, 1)
            glow.style.opacity = Math.min(1, flare * 0.9 + rest * 0.28).toFixed(3)
            glow.style.transform = `translate(-50%, -50%) scale(${(0.75 + flare * 0.45 + rest * 0.1).toFixed(3)})`
          }
          const chant = chantRef.current
          if (chant) {
            const t = easeOutQuart(seg(p, 0.9, 0.947))
            chant.style.opacity = t.toFixed(3)
            chant.style.transform = `translate3d(0, ${((1 - t) * 26).toFixed(1)}px, 0)`
          }
          const caption = captionRef.current
          if (caption) {
            const t = easeOutQuart(seg(p, 0.925, 0.968))
            caption.style.opacity = t.toFixed(3)
            caption.style.transform = `translate3d(0, ${((1 - t) * 20).toFixed(1)}px, 0)`
          }
        }
      }

      const fill = railFillRef.current
      if (fill) fill.style.setProperty('--rail-p', p.toFixed(4))
      const hint = hintRef.current
      if (hint) hint.style.opacity = (0.55 * (1 - seg(p, 0.02, 0.07))).toFixed(3)

      drawField(p, time)
    }

    function syncChapter(p: number) {
      let index = 0
      for (let i = CHAPTERS.length - 1; i >= 0; i -= 1) {
        if (p >= CHAPTERS[i].at - 0.0001) {
          index = i
          break
        }
      }
      if (index !== chapterIndex) {
        chapterIndex = index
        setActiveChapter(index)
      }
    }

    function loop(now: number) {
      rafId = window.requestAnimationFrame(loop)
      const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016
      lastTime = now
      if (!section) return
      const rect = section.getBoundingClientRect()
      const travel = Math.max(rect.height - window.innerHeight, 1)
      const raw = clamp01(-rect.top / travel)
      if (smooth < 0) smooth = raw
      smooth += (raw - smooth) * (1 - Math.exp(-dt * 8))
      if (Math.abs(raw - smooth) < 0.0004) smooth = raw
      if (finePointer) {
        pointer.x += (pointer.tx - pointer.x) * 0.08
        pointer.y += (pointer.ty - pointer.y) * 0.08
      }
      render(smooth, now * 0.001)
      syncChapter(smooth)
    }

    function start() {
      if (rafId) return
      lastTime = performance.now()
      rafId = window.requestAnimationFrame(loop)
    }

    function stop() {
      if (!rafId) return
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }

    function handlePointer(event: PointerEvent) {
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(stage)
    resize()

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start()
        else stop()
      },
      { rootMargin: '15% 0px' },
    )
    intersectionObserver.observe(section)

    if (finePointer) window.addEventListener('pointermove', handlePointer, { passive: true })

    return () => {
      stop()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      if (finePointer) window.removeEventListener('pointermove', handlePointer)
      section.removeAttribute('data-ready')
    }
  }, [storyActive])

  const goToChapter = useCallback((index: number) => {
    const section = sectionRef.current
    if (!section) return
    const rect = section.getBoundingClientRect()
    const travel = Math.max(rect.height - window.innerHeight, 1)
    const top = window.scrollY + rect.top + travel * CHAPTERS[index].target
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  const identity = formatCabinetTitle(settings)
  const orgContext = `${settings.programName} · ${settings.facultyName}`
  const prologue = { kicker: fields.kicker, titleLines: [fields.titleLine1, fields.titleLine2], body: fields.body }
  const steps = [1, 2, 3].map((number) => ({
    label: fields[`step${number}Label`],
    title: fields[`step${number}Title`],
    body: fields[`step${number}Body`],
  }))
  const finale = { line: fields.finaleLine, caption: interpolatePageText(fields.finaleCaption, { period: settings.periodLabel }) }
  const chapterLabels = [fields.introLabel, ...steps.map((step) => step.label), settings.cabinetName]
  const missionWords = splitSentences(steps[2].title)
  const deckPhotos = PHOTOS.map((photo, index) => ({
    src: aboutMediaSlots[index].url || photo.src,
    alt: aboutMediaSlots[index].alt || photo.alt,
    position: `${aboutMediaSlots[index].focalPointX}% ${aboutMediaSlots[index].focalPointY}%`,
  }))

  return (
    <section
      ref={sectionRef}
      className="about-story"
      id="tentang"
      data-chapter={activeChapter}
      aria-labelledby="about-story-title"
    >
      {/*
        Dua versi, satu yang tampil (diputuskan CSS di css/home-mobile.css,
        gerbangnya sama dengan pembuka beranda): AboutDeck untuk HP & mode
        aplikasi, panggung cerita scroll di bawahnya untuk layar lebar.
      */}
      <AboutDeck
        identity={identity}
        orgContext={orgContext}
        chapterLabels={chapterLabels}
        prologue={prologue}
        steps={steps}
        missionWords={missionWords}
        finale={finale}
        photos={deckPhotos}
      />

      <div ref={stageRef} className="about-story-stage">
        <canvas ref={canvasRef} className="about-story-canvas" aria-hidden="true" />
        <div className="about-story-tone" aria-hidden="true" />

        <div className="about-story-cast">
          {PHOTOS.map((photo, index) => {
            const media = aboutMediaSlots[index]
            return (
              <figure
                key={photo.variant}
                ref={(el) => {
                  photoRefs.current[index] = el
                }}
                className={`about-story-photo about-story-photo--${photo.variant}`}
              >
                <Image
                  src={media.url || photo.src}
                  alt={media.alt || photo.alt}
                  fill
                  sizes="(max-width: 880px) 74vw, 34vw"
                  style={{ objectPosition: `${media.focalPointX}% ${media.focalPointY}%` }}
                />
              </figure>
            )
          })}
        </div>

        <header className="about-story-meta">
          <strong>{identity}</strong>
          <p>{orgContext}</p>
        </header>

        <div ref={prologRef} className="about-story-prolog">
          <span ref={prologKickerRef} className="about-story-kicker">{prologue.kicker}</span>
          <h2 id="about-story-title">
            {prologue.titleLines.map((line, index) => (
              <span className="about-story-line" key={line}>
                <span
                  ref={(el) => {
                    prologLineRefs.current[index] = el
                  }}
                  className="about-story-line-inner"
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <p ref={prologBodyRef}>{prologue.body}</p>
        </div>

        <div className="about-story-chapters">
          {steps.map((step, index) => (
            <article
              key={step.label}
              ref={(el) => {
                chapterRefs.current[index] = el
              }}
              className={`about-story-chapter about-story-chapter--${index}`}
              aria-hidden={activeChapter !== index + 1}
            >
              <span className="about-story-kicker">{step.label}</span>
              {index === 2 ? (
                <h3 className="about-story-words">
                  {missionWords.map((word, wordIndex) => (
                    <span className="about-story-line" key={word}>
                      <span
                        ref={(el) => {
                          wordRefs.current[wordIndex] = el
                        }}
                        className="about-story-line-inner"
                      >
                        {word}
                      </span>
                    </span>
                  ))}
                </h3>
              ) : (
                <h3>{step.title}</h3>
              )}
              <p>{step.body}</p>
            </article>
          ))}
        </div>

        <div ref={finaleRef} className="about-story-finale" aria-hidden={activeChapter !== 4}>
          <div className="about-story-mark">
            <div ref={glowRef} className="about-story-glow" aria-hidden="true" />
            <span ref={beamRef} className="about-story-beam" aria-hidden="true" />
            <div ref={logoRef} className="about-story-logo">
              <LogoMark width={520} height={154} className="about-story-logo-img" />
            </div>
          </div>
          <p ref={chantRef} className="about-story-chant">{finale.line}</p>
          <p ref={captionRef} className="about-story-caption">{finale.caption}</p>
        </div>

        <nav className="about-story-rail" aria-label="Bab cerita Tentang HMTE">
          <span className="about-story-rail-track" aria-hidden="true">
            <i ref={railFillRef} />
          </span>
          {CHAPTERS.map((chapter, index) => (
            <button
              type="button"
              key={chapter.key}
              className={index === activeChapter ? 'is-active' : undefined}
              style={{ '--rail-at': chapter.at } as React.CSSProperties}
              onClick={() => goToChapter(index)}
              aria-label={`Buka bab ${chapterLabels[index]}`}
              aria-current={index === activeChapter ? 'step' : undefined}
            >
              <i aria-hidden="true" />
              <span>{chapterLabels[index]}</span>
            </button>
          ))}
        </nav>

        <p ref={hintRef} className="about-story-hint">{fields.scrollHint}</p>
      </div>
    </section>
  )
}
