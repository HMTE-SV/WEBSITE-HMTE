'use client'

import { useEffect, useRef } from 'react'
import { LedBoardEngine, type LedScene } from './led-engine'

type LedBoardProps = {
  scenes: LedScene[]
  /** Ulang program terus-menerus; tanpa ini adegan terakhir jadi bingkai istirahat. */
  loop?: boolean
  /** Jarak antartitik (px CSS) di HP dan di layar ≥ 900px. */
  pitch: number
  widePitch?: number
  /** Adegan yang ditampilkan diam saat pengguna meminta gerakan dikurangi. */
  still?: number
  /** Mulai hanya ketika papan benar-benar terlihat sebanyak ini. */
  threshold?: number
  className?: string
}

const FRAME_MS = 1000 / 30

function readFamily() {
  // Nilai custom property sudah tersubstitusi di tahap computed: ini daftar
  // keluarga Geist yang sebenarnya dari next/font, bukan teks "var(...)".
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim()
  return family || 'system-ui, sans-serif'
}

/*
 * Kanvas papan LED. Selalu dekoratif (aria-hidden): setiap teks yang tampil
 * di papan juga ada di DOM di sekitarnya, jadi pembaca layar dan mesin
 * pencari tidak kehilangan apa-apa.
 */
export function LedBoard({ scenes, loop = false, pitch, widePitch, still = 0, threshold = 0.25, className }: LedBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const programKey = JSON.stringify(scenes)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const program: LedScene[] = JSON.parse(programKey)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const wide = window.matchMedia('(min-width: 900px)')
    const engine = new LedBoardEngine(canvas, { pitch: wide.matches && widePitch ? widePitch : pitch, family: readFamily() })

    let raf = 0
    let last = 0
    let visible = false
    let ready = false
    let started = false
    let disposed = false

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      engine.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2))
    }

    const frame = (now: number) => {
      raf = 0
      if (now - last < FRAME_MS - 2) {
        raf = requestAnimationFrame(frame)
        return
      }
      last = now
      if (engine.tick(now) && visible && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (disposed || !ready) return
      if (reduced) {
        engine.renderStill(still)
        return
      }
      if (!visible || document.hidden) return
      if (!started) {
        started = true
        engine.setProgram(program, loop, performance.now())
      }
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (wide.matches && widePitch) engine.setPitch(widePitch)
      else engine.setPitch(pitch)
      measure()
      if (!ready) return
      if (reduced) engine.renderStill(still)
      else wake()
    })
    resizeObserver.observe(canvas)

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        wake()
      },
      { threshold },
    )
    intersectionObserver.observe(canvas)

    const onVisibility = () => wake()
    document.addEventListener('visibilitychange', onVisibility)

    measure()
    // Huruf harus sudah dimuat sebelum dicacah, atau papan mencetak huruf cadangan.
    Promise.all([document.fonts.ready, engine.prepare(program)]).then(() => {
      if (disposed) return
      ready = true
      engine.setProgram(program, loop, performance.now())
      measure()
      wake()
    })

    return () => {
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [programKey, loop, pitch, widePitch, still, threshold])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

