'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { instagramLabel, instagramUrl } from '@/lib/site-settings'
import { ArrowIcon, Sparks } from './HomeMotion'

/* Penutup: kotak aurora kedua yang menggemakan pembuka, dengan sorakan himpunan. */
export function HomeClose() {
  const { fields } = usePageSection('cta')
  const settings = useSiteSettings()
  const cabinetLogo = useMediaSlot('cabinet.logo')

  return (
    <section className="av-sec av-close" id="hubungi" aria-labelledby="av-close-title">
      <div className="av-frame">
        <div className="av-close-box" data-reveal="">
          <span className="av-sky" aria-hidden="true">
            <i className="av-sky-a" />
            <i className="av-sky-b" />
            <i className="av-sky-c" />
          </span>
          <Sparks />

          <p className="av-cheer">
            <Image src={cabinetLogo.url} alt="" width={72} height={72} />
            <span>{settings.closingCheer}</span>
          </p>

          <div className="av-close-grid">
            <h2 id="av-close-title" className="av-display">
              {fields.titleLine1} <span className="av-display-soft">{fields.titleMuted}</span> {fields.titleLine3}
              <span className="av-accent">.</span>
            </h2>
            <div className="av-close-copy">
              <p className="av-lead">{fields.body}</p>
              <a className="av-channel-link" href={instagramUrl(settings)} target="_blank" rel="noopener noreferrer">
                <span>{fields.channelLabel}</span>
                <strong>Instagram {instagramLabel(settings)}</strong>
                <ArrowIcon direction="up-right" />
              </a>
              <div className="av-actions">
                <Link className="av-btn av-btn--light" href={fields.primaryHref}>
                  <strong>{fields.primaryAction}</strong>
                  <ArrowIcon />
                </Link>
                <Link className="av-btn av-btn--glass" href={fields.secondaryHref}>
                  <strong>{fields.secondaryAction}</strong>
                  <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
