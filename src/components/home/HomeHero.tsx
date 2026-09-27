'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { heroIdentity } from '@/data/site-content'
import type { PublicArticle } from '@/lib/article-data'
import { formatCabinetTitle } from '@/lib/site-settings'
import { ArrowIcon, Sparks } from './HomeMotion'

type HomeHeroProps = {
  articles: PublicArticle[]
}

/*
 * Pembuka: logo kabinet sebagai sumber cahaya. Busur biru raksasa naik di
 * belakangnya, cincin aurora berputar, bintangnya bernapas. Di dasar kotak,
 * pita judul berita terbaru berjalan pelan (berhenti saat disentuh/diarahkan).
 */
export function HomeHero({ articles }: HomeHeroProps) {
  const { fields } = usePageSection('hero')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')
  const cabinetTitle = formatCabinetTitle(settings)
  const headlines = articles.slice(0, 6)

  return (
    <section className="av-hero" id="beranda" aria-labelledby="av-hero-title">
      <div className="av-hero-box">
        <span className="av-sky" aria-hidden="true">
          <i className="av-sky-a" />
          <i className="av-sky-b" />
          <i className="av-sky-c" />
        </span>
        <Sparks />
        <span className="av-orbit" aria-hidden="true">
          <i className="av-orbit-arc" />
        </span>

        <div className="av-emblem">
          <div className="av-emblem-core">
            <span className="av-emblem-ring" aria-hidden="true" />
            <span className="av-emblem-halo" aria-hidden="true" />
            <Image
              className="av-emblem-logo"
              src={cabinetLogo.url}
              alt={cabinetLogo.alt || `Logo ${cabinetTitle}`}
              width={440}
              height={440}
              sizes="(max-width: 900px) 170px, 240px"
              priority
            />
          </div>
        </div>

        <div className="av-hero-copy">
          <h1 id="av-hero-title">{fields.heroTitle}</h1>
          <p className="av-hero-lead">{heroIdentity.tagline}</p>
          <div className="av-hero-actions">
            <a className="av-btn av-btn--light" href="#kabar">
              <span>
                <strong>{fields.quickTitle}</strong>
                <small>{fields.quickBody}</small>
              </span>
              <ArrowIcon direction="down" />
            </a>
            <a className="av-btn av-btn--glass" href={heroIdentity.ctaHref}>
              <strong>{heroIdentity.ctaLabel}</strong>
              <ArrowIcon />
            </a>
          </div>
        </div>

        <div className="av-hero-meta">
          <p className="av-status">
            <span className="av-status-dot" aria-hidden="true" />
            {fields.brandLabel} · {fields.systemStatus}
          </p>
          <p className="av-hero-cabinet">
            <strong>{cabinetTitle}</strong>
            <span>{settings.periodLabel}</span>
          </p>
        </div>

        <div className="av-ticker">
          {headlines.length ? (
            <div className="av-ticker-track">
              {[0, 1].map((copy) => (
                <ul className="av-ticker-list" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                  {headlines.map((article) => (
                    <li key={article.slug}>
                      <Link href={`/berita/${article.slug}`} tabIndex={copy === 1 ? -1 : undefined}>
                        <span>{article.categoryLabel}</span>
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          ) : (
            <p className="av-ticker-still">
              {cabinetTitle} · {settings.periodLabel} · {settings.closingCheer}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
