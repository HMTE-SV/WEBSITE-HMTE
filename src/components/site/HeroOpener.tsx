'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { LogoMark } from '@/components/site/Brand'
import { useMediaSlot, useMediaSlots } from '@/components/site/MediaSlotProvider'
import { MOBILE_MENU_ID, useMobileMenu } from '@/components/site/MobileMenu'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { heroActivityImages, heroIdentity } from '@/data/site-content'
import { formatCabinetTitle } from '@/lib/site-settings'

/*
 * Pembuka beranda untuk layar kecil dan mode aplikasi (PWA).
 *
 * Di desktop, beranda dibuka oleh cerita scroll (Hero.tsx) setinggi beberapa
 * layar. Di HP cerita itu memaksa pengunjung menggulir ±6,6 layar sebelum
 * bertemu konten, jadi di sini ia dilewati penuh: pembuka ini langsung
 * menyajikan BINGKAI AKHIR cerita desktop — dinding foto kegiatan dan logo
 * HMTE — lalu menghidupkannya dengan animasi CSS murni, tanpa scroll-jacking
 * dan tanpa JS per frame:
 *
 *   1. Enam foto muncul bergantian membentuk dinding (sama seperti finale desktop).
 *   2. Logo naik dengan pendar emas, teks menyusul.
 *   3. Setelah itu satu foto demi satu foto "disorot" pelan, berulang, supaya
 *      layar pembuka terasa hidup tanpa menarik perhatian dari tombol.
 *
 * Mana yang tampil diputuskan CSS (css/hero-opener.css), bukan JS: server
 * tidak tahu lebar layar, dan memutuskannya di klien membuat layar berkedip.
 * Semua teks diambil dari konten yang sudah ada; tidak ada salinan baru.
 */

const HERO_MEDIA_SLOT_KEYS = heroActivityImages.map((_, index) => `home.hero.${index + 1}`)

export function HeroOpener() {
  const { fields } = usePageSection('hero')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const heroMediaSlots = useMediaSlots(HERO_MEDIA_SLOT_KEYS)
  const mobileMenu = useMobileMenu()
  const tiles = heroActivityImages.map((image, index) => ({
    src: heroMediaSlots[index].url || image.src,
    focalPointX: heroMediaSlots[index].focalPointX,
    focalPointY: heroMediaSlots[index].focalPointY,
  }))

  return (
    <section className="hero-opener" aria-labelledby="hero-opener-title">
      <div className="hero-opener-wall" aria-hidden="true">
        {tiles.map((tile, index) => (
          <figure
            className="hero-opener-tile"
            style={{ '--tile-index': index } as CSSProperties}
            key={`${tile.src}-${index}`}
          >
            <Image
              src={tile.src}
              alt=""
              fill
              // Dua kolom di HP; di tablet mode aplikasi tiga kolom.
              sizes="(max-width: 600px) 50vw, 34vw"
              style={{ objectPosition: `${tile.focalPointX}% ${tile.focalPointY}%` }}
            />
          </figure>
        ))}
      </div>
      <div className="hero-opener-tone" aria-hidden="true" />

      <div className="hero-opener-bar">
        <LogoMark width={96} height={28} className="hero-opener-bar-logo" />
        <button
          type="button"
          className="hero-opener-menu"
          aria-haspopup="dialog"
          aria-expanded={mobileMenu.isOpen}
          aria-controls={MOBILE_MENU_ID}
          onClick={mobileMenu.open}
        >
          Menu
          <span aria-hidden="true"><i /><i /></span>
        </button>
      </div>

      <div className="hero-opener-body">
        <div className="hero-opener-mark">
          <span className="hero-opener-glow" aria-hidden="true" />
          <LogoMark width={700} height={206} className="hero-opener-logo" priority />
        </div>

        <div className="hero-opener-copy">
          <p className="hero-opener-kicker">
            <Image src={cabinetLogo.url} alt="" width={28} height={28} className="hero-opener-cabinet" />
            {formatCabinetTitle(settings)} · {settings.periodLabel}
          </p>
          <h1 id="hero-opener-title">{fields.heroTitle}</h1>
          <p className="hero-opener-lead">{heroIdentity.tagline}</p>
        </div>

        <div className="hero-opener-actions">
          <a className="hero-opener-primary" href="#kabar">
            <span>
              <strong>{fields.quickTitle}</strong>
              <small>{fields.quickBody}</small>
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" /></svg>
          </a>
          <a className="hero-opener-secondary" href={heroIdentity.ctaHref}>
            {heroIdentity.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  )
}
