'use client'

import Link from 'next/link'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { instagramLabel } from '@/lib/site-settings'

export function CTA() {
  const settings = useSiteSettings()
  const { fields } = usePageSection('cta')
  return (
    <section className="tre-cta" id="hubungi">
      <div className="cta-shell">
        <div className="cta-left fade-up">
          <h2 className="cta-h2">
            {fields.titleLine1}
            <br />
            <span className="muted">{fields.titleMuted}</span>
            <br />
            {fields.titleLine3}
            <span className="acc">.</span>
          </h2>
        </div>
        <div className="cta-right fade-up">
          <p className="cta-p">{fields.body}</p>
          <div className="cta-deadline">
            <div className="dl-label">{fields.channelLabel}</div>
            <div className="dl-date">Instagram {instagramLabel(settings)}</div>
          </div>
          <div className="cta-actions">
            <Link href={fields.primaryHref} className="btn btn-primary-gold">
              {fields.primaryAction}{' '}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href={fields.secondaryHref} className="btn btn-secondary-dark">
              {fields.secondaryAction}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
