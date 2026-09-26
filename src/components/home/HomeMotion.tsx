'use client'

import Image, { getImageProps } from 'next/image'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

/*
 * Penyala beranda.
 *
 * Tanpa JS, atau saat pengguna meminta gerakan dikurangi, semua isi tampil
 * utuh sejak awal. Hanya bila gerakan diizinkan, akar `.p10` diberi
 * [data-motion] dan elemen ber-[data-lit] menunggu masuk layar sebelum
 * "menyala" (kelas is-lit). Foto titik (DotPhoto) memakai sinyal yang sama,
 * lalu diberi is-done setelah titiknya melebur, supaya masker dilepas dan
 * foto tampil tanpa sisa kisi.
 */
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.p10')
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    root.setAttribute('data-motion', '')
    const timers = new Set<number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const element = entry.target as HTMLElement
          element.classList.add('is-lit')
          observer.unobserve(element)
          if (element.classList.contains('dotp')) {
            const timer = window.setTimeout(() => {
              element.classList.add('is-done')
              timers.delete(timer)
            }, 1500)
            timers.add(timer)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )
    root.querySelectorAll('[data-lit]').forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
      timers.forEach((timer) => window.clearTimeout(timer))
      root.removeAttribute('data-motion')
      root.querySelectorAll('.is-lit, .is-done').forEach((element) => element.classList.remove('is-lit', 'is-done'))
    }
  }, [])

  /*
   * Dua kebiasaan jempol, berlaku juga saat gerakan dikurangi:
   * - mengetuk Beranda/logo saat sudah di beranda membawa kembali ke atas
   *   (Next tidak berbuat apa-apa untuk tautan ke halaman yang sama);
   * - di layar sempit, header menyingkir saat menggulir turun dan kembali
   *   saat menggulir naik: navigasi sudah ada di kapsul bawah, jadi 64px
   *   di atas lebih berguna untuk isi.
   */
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.p10')
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

type DotPhotoProps = {
  src: string
  alt: string
  sizes: string
  position?: string
  className?: string
  priority?: boolean
  children?: ReactNode
}

/** Foto yang muncul dari titik LED lalu melebur menjadi gambar utuh. */
export function DotPhoto({ src, alt, sizes, position, className, priority, children }: DotPhotoProps) {
  return (
    <figure className={className ? `dotp ${className}` : 'dotp'} data-lit="">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={position ? { objectPosition: position } : undefined} />
      {children}
    </figure>
  )
}

/*
 * URL gambar kecil dari optimizer Next untuk dicetak di papan LED: papan hanya
 * butuh ±100 titik lebar, dan canvas boleh membaca piksel gambar satu origin.
 */
export function boardImage(src: string) {
  return getImageProps({ src, alt: '', width: 256, height: 160 }).props.src
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'down' }) {
  return (
    <svg className="p10-icon" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {direction === 'down' ? <path d="M12 4.5v15m-6-6 6 6 6-6" /> : <path d="M4.5 12h15m-6-6 6 6-6 6" />}
    </svg>
  )
}

export function ChevronIcon() {
  return (
    <svg className="p10-icon" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  )
}
