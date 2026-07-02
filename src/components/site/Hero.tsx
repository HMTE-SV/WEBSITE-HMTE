'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { heroActivityImages, heroIdentity } from '@/data/site-content'

const PHOTO_PHASE_END = 0.72
const WALLPAPER_TILE_COUNT = 15

const wallpaperTiles = Array.from({ length: WALLPAPER_TILE_COUNT }, (_, index) => ({
  ...heroActivityImages[index % heroActivityImages.length],
  key: `wallpaper-${index}`,
}))

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const activeIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) {
      const finalScale = window.innerWidth <= 760 ? 2.55 : 3.25
      section.style.setProperty('--hero-logo-progress', '1')
      section.style.setProperty('--hero-wall-progress', '1')
      section.style.setProperty('--hero-photo-opacity', '0')
      section.style.setProperty('--hero-logo-offset', '0svh')
      section.style.setProperty('--hero-logo-scale', finalScale.toString())
      section.style.setProperty('--hero-wall-opacity', '1')
      section.style.setProperty('--hero-wall-scale', '1')
      section.style.setProperty('--hero-wall-shift', '0px')
      section.style.setProperty('--hero-grid-opacity', '0.34')
      section.style.setProperty('--hero-aura-opacity', '1')
      section.style.setProperty('--hero-gold-glow', '0.15')
      section.style.setProperty('--hero-final-marker-width', '38px')
      section.style.setProperty('--hero-final-marker-alpha', '1')
      return
    }

    let animationFrame = 0

    const updateFromScroll = () => {
      animationFrame = 0
      const element = sectionRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const scrollDistance = Math.max(element.offsetHeight - window.innerHeight, 1)
      const progress = Math.min(Math.max(-rect.top / scrollDistance, 0), 1)
      const photoProgress = Math.min(progress / PHOTO_PHASE_END, 0.9999)
      const nextIndex = Math.min(
        Math.floor(photoProgress * heroActivityImages.length),
        heroActivityImages.length - 1,
      )
      const logoProgress = Math.min(
        Math.max((progress - PHOTO_PHASE_END) / (1 - PHOTO_PHASE_END), 0),
        1,
      )
      const finalLogoScale = window.innerWidth <= 760 ? 2.55 : 3.25

      element.style.setProperty('--hero-scroll-progress', progress.toFixed(4))
      element.style.setProperty('--hero-logo-progress', logoProgress.toFixed(4))
      element.style.setProperty('--hero-wall-progress', logoProgress.toFixed(4))
      element.style.setProperty('--hero-photo-opacity', (1 - logoProgress).toFixed(4))
      element.style.setProperty('--hero-logo-offset', `${((1 - logoProgress) * 39).toFixed(3)}svh`)
      element.style.setProperty(
        '--hero-logo-scale',
        (1 + logoProgress * (finalLogoScale - 1)).toFixed(4),
      )
      element.style.setProperty('--hero-wall-opacity', logoProgress.toFixed(4))
      element.style.setProperty('--hero-wall-scale', (0.88 + logoProgress * 0.12).toFixed(4))
      element.style.setProperty('--hero-wall-shift', `${((1 - logoProgress) * 18).toFixed(2)}px`)
      element.style.setProperty('--hero-grid-opacity', (0.12 + logoProgress * 0.22).toFixed(4))
      element.style.setProperty('--hero-aura-opacity', (0.18 + logoProgress * 0.82).toFixed(4))
      element.style.setProperty('--hero-gold-glow', (0.04 + logoProgress * 0.11).toFixed(4))
      element.style.setProperty('--hero-final-marker-width', `${(18 + logoProgress * 20).toFixed(2)}px`)
      element.style.setProperty('--hero-final-marker-alpha', (0.3 + logoProgress * 0.7).toFixed(4))

      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex
        setActiveIndex(nextIndex)
      }
    }

    const scheduleUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateFromScroll)
      }
    }

    updateFromScroll()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <section
      className="tre-hero hero-scroll-story"
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-title"
    >
      <h1 className="sr-only" id="hero-title">{heroIdentity.name}</h1>

      <div className="hero-scroll-stage">
        <div className="hero-scroll-wall" aria-hidden="true">
          {wallpaperTiles.map((tile, index) => (
            <figure
              className="hero-scroll-wall-tile"
              style={{ '--wall-tile-index': index } as CSSProperties}
              key={tile.key}
            >
              <Image
                src={tile.src}
                alt=""
                fill
                sizes="(max-width: 760px) 50vw, 24vw"
                className="hero-scroll-wall-image"
              />
            </figure>
          ))}
        </div>

        <div className="hero-scroll-slides" aria-hidden="true">
          {heroActivityImages.map((image, index) => (
            <figure
              className={`hero-scroll-slide${index === activeIndex ? ' is-active' : ''}`}
              key={image.src}
            >
              <Image
                src={image.src}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="hero-scroll-slide-image"
              />
            </figure>
          ))}
        </div>

        <div className="hero-scroll-tone" aria-hidden="true" />
        <div className="hero-scroll-grid" aria-hidden="true" />

        <div className="hero-scroll-logo-wrap">
          <div className="hero-scroll-logo-aura" aria-hidden="true" />
          <LogoMark
            width={700}
            height={206}
            className="hero-scroll-logo"
            priority
          />
        </div>

        <div className="hero-scroll-markers" aria-hidden="true">
          {heroActivityImages.map((image, index) => (
            <span className={index === activeIndex ? 'is-active' : undefined} key={image.src} />
          ))}
          <span className="hero-scroll-marker-final" />
        </div>

        <p className="sr-only" aria-live="polite">
          {heroActivityImages[activeIndex].alt}
        </p>
      </div>
    </section>
  )
}
