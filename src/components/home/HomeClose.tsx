'use client'

import Link from 'next/link'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { formatCabinetTitle, instagramLabel, instagramUrl } from '@/lib/site-settings'
import { ArrowIcon } from './HomeMotion'
import { LedBoard } from './LedBoard'

export function HomeClose() {
  const { fields } = usePageSection('cta')
  const settings = useSiteSettings()

  return (
    <section className="p10-close p10-module" id="hubungi" aria-labelledby="p10-close-title">
      <div className="p10-board p10-board--cheer">
        <LedBoard
          scenes={[
            { kind: 'boot', duration: 800 },
            { kind: 'text', text: settings.closingCheer, hold: 3200 },
            { kind: 'marquee', text: `${formatCabinetTitle(settings)} · ${settings.periodLabel} · ${settings.closingCheer}`.toUpperCase(), speed: 40 },
          ]}
          loop
          pitch={4}
          widePitch={8}
          still={1}
          threshold={0.4}
        />
      </div>

      <div className="p10-close-grid">
        <h2 id="p10-close-title" className="p10-display">
          {fields.titleLine1} <span className="p10-display-soft">{fields.titleMuted}</span> {fields.titleLine3}
          <span className="p10-accent">.</span>
        </h2>
        <div className="p10-close-copy">
          <p className="p10-lead">{fields.body}</p>
          <a className="p10-channel" href={instagramUrl(settings)} target="_blank" rel="noopener noreferrer">
            <span>{fields.channelLabel}</span>
            <strong>Instagram {instagramLabel(settings)}</strong>
            <ArrowIcon />
          </a>
          <div className="p10-actions">
            <Link className="p10-button p10-button--gold" href={fields.primaryHref}>
              <strong>{fields.primaryAction}</strong>
              <ArrowIcon />
            </Link>
            <Link className="p10-button p10-button--ghost" href={fields.secondaryHref}>
              <strong>{fields.secondaryAction}</strong>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
