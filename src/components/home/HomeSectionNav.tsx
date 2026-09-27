'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'

type SectionLink = { id: string; label: string }

/*
 * Bilah lompat-seksi untuk layar sempit (<900px). Selama hero terlihat,
 * header biasa yang tampil; begitu hero lewat, header menyingkir dan bilah
 * ini menggantikannya: logo kabinet (kembali ke atas) + deret seksi beranda
 * dengan penanda seksi yang sedang dibaca. Navigasi antarhalaman tetap di
 * kapsul bawah. Di desktop bilah ini disembunyikan CSS.
 */
export function HomeSectionNav({ sections }: { sections: SectionLink[] }) {
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const [active, setActive] = useState<string | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.av')
    if (!root) return
    const hero = document.querySelector<HTMLElement>('.av-hero')
    let heroWatch: IntersectionObserver | null = null
    if (hero) {
      heroWatch = new IntersectionObserver(
        ([entry]) => root.classList.toggle('is-past-hero', !entry.isIntersecting && entry.boundingClientRect.top < 0),
        { rootMargin: '-72px 0px 0px 0px' },
      )
      heroWatch.observe(hero)
    } else {
      root.classList.add('is-past-hero')
    }

    // Seksi aktif = seksi terakhir yang tepi atasnya sudah melewati 40% layar.
    let frame = 0
    function spy() {
      frame = 0
      const line = window.innerHeight * 0.4
      let current: string | null = null
      for (const { id } of sections) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(spy)
    }
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      heroWatch?.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
      root.classList.remove('is-past-hero')
    }
  }, [sections])

  // Penanda aktif selalu terlihat di deretnya.
  useEffect(() => {
    const rail = railRef.current
    const chip = rail?.querySelector<HTMLElement>('[aria-current]')
    if (!rail || !chip || rail.scrollWidth <= rail.clientWidth) return
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])

  function go(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav className="av-jump" aria-label="Bagian beranda">
      <a className="av-jump-home" href="#beranda" aria-label="Kembali ke atas" onClick={(event) => go(event, 'beranda')}>
        <Image src={cabinetLogo.url} alt="" width={64} height={64} />
      </a>
      <div className="av-jump-rail" ref={railRef}>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
            onClick={(event) => go(event, section.id)}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
