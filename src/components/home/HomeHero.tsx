'use client'

import Image from 'next/image'
import { useMediaSlot, useMediaSlots } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { heroActivityImages, heroIdentity } from '@/data/site-content'
import type { PublicArticle } from '@/lib/article-data'
import { formatCabinetTitle } from '@/lib/site-settings'
import { ArrowIcon, boardImage } from './HomeMotion'
import { LedBoard } from './LedBoard'
import type { LedScene } from './led-engine'

const HERO_MEDIA_SLOT_KEYS = heroActivityImages.map((_, index) => `home.hero.${index + 1}`)

type HomeHeroProps = {
  articles: PublicArticle[]
}

export function HomeHero({ articles }: HomeHeroProps) {
  const { fields } = usePageSection('hero')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const heroMediaSlots = useMediaSlots(HERO_MEDIA_SLOT_KEYS)
  const cabinetTitle = formatCabinetTitle(settings)

  const photoScenes: LedScene[] = heroActivityImages.map((image, index) => ({
    kind: 'image',
    src: boardImage(heroMediaSlots[index].url || image.src),
    focalX: heroMediaSlots[index].focalPointX,
    focalY: heroMediaSlots[index].focalPointY,
    hold: 2300,
  }))
  // Foto kegiatan diselingi nama: papan tidak pernah terlalu lama tanpa identitas.
  const program: LedScene[] = [
    { kind: 'text', text: 'HMTE', hold: 2200 },
    ...photoScenes.slice(0, 3),
    { kind: 'text', text: settings.cabinetName.toUpperCase(), hold: 2000 },
    ...photoScenes.slice(3),
  ]

  const tickerItems = articles.slice(0, 6).map((article) => `${article.categoryLabel} · ${article.publishedLabel} — ${article.title}`)
  const ticker = (tickerItems.length ? tickerItems : [`${cabinetTitle} · ${settings.periodLabel}`, settings.closingCheer]).join('   ◆   ').toUpperCase()

  return (
    <section className="p10-hero" id="beranda" aria-labelledby="p10-hero-title">
      <div className="p10-hero-panel">
        <div className="p10-board p10-board--hero">
          <LedBoard scenes={[{ kind: 'boot', duration: 900 }, ...program]} loop pitch={6} widePitch={9} still={1} threshold={0.1} />
          <span className="p10-board-glass" aria-hidden="true" />
        </div>

        <div className="p10-hero-copy">
          <h1 id="p10-hero-title">{fields.heroTitle}</h1>
          <p className="p10-hero-lead">{heroIdentity.tagline}</p>
        </div>

        <div className="p10-hero-actions">
          <a className="p10-button p10-button--gold" href="#kabar">
            <span>
              <strong>{fields.quickTitle}</strong>
              <small>{fields.quickBody}</small>
            </span>
            <ArrowIcon direction="down" />
          </a>
          <a className="p10-button p10-button--ghost" href={heroIdentity.ctaHref}>
            <strong>{heroIdentity.ctaLabel}</strong>
            <ArrowIcon />
          </a>
        </div>

        <div className="p10-hero-meta">
          <p className="p10-status">
            <span className="p10-status-led" aria-hidden="true" />
            {fields.brandLabel} · {fields.systemStatus}
          </p>
          <p className="p10-hero-cabinet">
            <Image src={cabinetLogo.url} alt="" width={32} height={32} />
            <span>
              <strong>{cabinetTitle}</strong>
              {settings.periodLabel}
            </span>
          </p>
        </div>
      </div>

      <div className="p10-ticker">
        <div className="p10-board p10-board--ticker">
          <LedBoard scenes={[{ kind: 'marquee', text: ticker, speed: 30 }]} loop pitch={3} widePitch={4} threshold={0} />
        </div>
      </div>
    </section>
  )
}
