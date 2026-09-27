'use client'

import { useEffect } from 'react'

/*
 * Penggerak beranda.
 *
 * Tanpa JS, atau saat pengguna meminta gerakan dikurangi, semua isi tampil
 * utuh sejak awal. Hanya bila gerakan diizinkan, akar `.av` diberi
 * [data-motion]: elemen ber-[data-reveal] menunggu masuk layar lalu muncul
 * dari cahaya (kelas is-in), angka ber-[data-count] menghitung naik, dan
 * hero membaca gulir (HP) serta pointer (desktop) lewat variabel CSS.
 */
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.av')
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    root.setAttribute('data-motion', '')
    const frames = new Set<number>()

    function countUp(element: HTMLElement) {
      const target = Number(element.dataset.count)
      if (!Number.isFinite(target) || target <= 0) return
      const start = performance.now()
      const duration = 1400
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 4)
        element.textContent = String(Math.round(target * eased))
        if (t < 1) {
          const id = requestAnimationFrame(step)
          frames.add(id)
        }
      }
      element.textContent = '0'
      frames.add(requestAnimationFrame(step))
    }

    const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'))
    counters.forEach((element) => {
      element.textContent = '0'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const element = entry.target as HTMLElement
          observer.unobserve(element)
          if (element.hasAttribute('data-count')) countUp(element)
          else element.classList.add('is-in')
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    root.querySelectorAll('[data-reveal], [data-count]').forEach((element) => observer.observe(element))

    // Hero: cahaya mengikuti gulir di semua layar, dan pointer di layar berpointer halus.
    const hero = root.querySelector<HTMLElement>('.av-hero')
    let heroFrame = 0
    let pointer = { x: 0, y: 0 }
    const fine = window.matchMedia('(pointer: fine)')
    function paintHero() {
      heroFrame = 0
      if (!hero) return
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)))
      hero.style.setProperty('--hp', progress.toFixed(3))
      hero.style.setProperty('--hx', pointer.x.toFixed(3))
      hero.style.setProperty('--hy', pointer.y.toFixed(3))
    }
    function queueHero() {
      if (!heroFrame) heroFrame = requestAnimationFrame(paintHero)
    }
    function onPointer(event: PointerEvent) {
      if (!hero || !fine.matches) return
      const rect = hero.getBoundingClientRect()
      pointer = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
      }
      queueHero()
    }
    function onLeave() {
      pointer = { x: 0, y: 0 }
      queueHero()
    }
    window.addEventListener('scroll', queueHero, { passive: true })
    hero?.addEventListener('pointermove', onPointer)
    hero?.addEventListener('pointerleave', onLeave)
    paintHero()

    return () => {
      observer.disconnect()
      frames.forEach((id) => cancelAnimationFrame(id))
      if (heroFrame) cancelAnimationFrame(heroFrame)
      window.removeEventListener('scroll', queueHero)
      hero?.removeEventListener('pointermove', onPointer)
      hero?.removeEventListener('pointerleave', onLeave)
      root.removeAttribute('data-motion')
      root.querySelectorAll('.is-in').forEach((element) => element.classList.remove('is-in'))
      counters.forEach((element) => {
        element.textContent = element.dataset.count ?? ''
      })
    }
  }, [])

  /*
   * Dua kebiasaan jempol, berlaku juga saat gerakan dikurangi:
   * - mengetuk Beranda/logo saat sudah di beranda membawa kembali ke atas
   *   (Next tidak berbuat apa-apa untuk tautan ke halaman yang sama);
   * - di layar sempit, header menyingkir saat menggulir turun dan kembali
   *   saat menggulir naik: navigasi sudah ada di kapsul bawah.
   */
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.av')
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = window.matchMedia('(max-width: 899.98px)')

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || link.target === '_blank') return
      const target = new URL(link.href, location.href)
      if (target.origin !== location.origin || target.pathname !== '/' || target.hash || location.pathname !== '/') return
      event.preventDefault()
      if (location.hash) history.replaceState(null, '', '/')
      window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' })
    }

    let lastY = window.scrollY
    let frame = 0
    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const y = window.scrollY
        const delta = y - lastY
        if (!narrow.matches || y < 120 || delta < -6) root?.classList.remove('is-hdr-hidden')
        else if (delta > 6) root?.classList.add('is-hdr-hidden')
        if (Math.abs(delta) > 6) lastY = y
      })
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      root.classList.remove('is-hdr-hidden')
    }
  }, [])

  return null
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'down' | 'up-right' }) {
  return (
    <svg className="av-icon" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {direction === 'down' ? (
        <path d="M12 4.5v15m-6-6 6 6 6-6" />
      ) : direction === 'up-right' ? (
        <path d="M7 17 17 7M8.5 7H17v8.5" />
      ) : (
        <path d="M4.5 12h15m-6-6 6 6-6 6" />
      )}
    </svg>
  )
}

export function ChevronIcon() {
  return (
    <svg className="av-icon" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  )
}

/** Bintik-bintik cahaya kecil di langit aurora; posisinya tetap supaya SSR dan klien sama. */
const SPARKS = [
  [8, 22, 0], [16, 64, 1.2], [23, 38, 2.4], [31, 12, 0.6], [38, 72, 1.8], [46, 30, 3],
  [57, 18, 0.9], [63, 58, 2.1], [71, 26, 1.5], [78, 68, 0.3], [84, 16, 2.7], [92, 44, 1.1],
  [12, 84, 2.2], [52, 82, 0.4], [88, 86, 1.7],
] as const

export function Sparks() {
  return (
    <span className="av-sparks" aria-hidden="true">
      {SPARKS.map(([x, y, delay]) => (
        <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />
      ))}
    </span>
  )
}
