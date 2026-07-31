import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getPublicMediaSlots } from '@/lib/media-slot-data'
import type { ResolvedMediaSlotMap } from '@/lib/media-slot-resolver'
import { getPageContent } from '@/lib/page-content-data'
import { interpolatePageText, type PageContentSection } from '@/lib/page-content'
import { getSiteSettings } from '@/lib/site-settings-data'
import { formatCabinetTitle, instagramLabel, instagramUrl, type SiteSettings } from '@/lib/site-settings'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent('contact')
  return { title: content.seoTitle, description: content.seoDescription }
}

type ContactSectionProps = {
  section: PageContentSection
  settings: SiteSettings
  slots: ResolvedMediaSlotMap
}

function variables(settings: SiteSettings) {
  return {
    organization: settings.organizationName,
    cabinet: formatCabinetTitle(settings),
    period: settings.periodLabel,
  }
}

function ContactHero({ section, settings }: ContactSectionProps) {
  const fields = section.fields
  const dynamic = variables(settings)
  const cabinetTitle = formatCabinetTitle(settings)
  return (
    <section className="postal-hero" aria-labelledby="contact-title">
      <div className="postal-airmail" aria-hidden="true" />
      <div className="postal-shell postal-hero-grid">
        <div className="postal-hero-copy">
          <p className="postal-eyebrow">{fields.eyebrow} · {cabinetTitle}</p>
          <h1 id="contact-title">{fields.titleLine1}<br /><em>{fields.titleEmphasis}</em></h1>
          <p className="postal-lead">{interpolatePageText(fields.lead, dynamic)}</p>
          <a className="postal-hint" href="#cara-kirim"><span>{fields.hint}</span><b aria-hidden="true">↓</b></a>
        </div>
        <div className="postal-hero-card" aria-hidden="true">
          <div className="postcard">
            <p className="postcard-note">{interpolatePageText(fields.postcardNote, dynamic)}</p>
            <i className="postcard-divider" />
            <div className="postcard-address">
              <span>{fields.recipientLabel}</span>
              <b>Program Studi {settings.programName}</b>
              <b>{settings.facultyName} · {settings.universityName}</b>
              <b>Periode {settings.periodLabel}</b>
            </div>
            <div className="postcard-stamp"><div className="postcard-stamp-inner"><span>{fields.stampTop}</span><strong>{fields.stampMain}</strong><span>{fields.stampBottom}</span></div></div>
            <div className="postcard-postmark"><span>{fields.postmarkCity}<br />{settings.cabinetName}<br />{settings.periodLabel}</span></div>
            <svg className="postcard-cancel" viewBox="0 0 88 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M2 4c10-4 18 4 28 0s18 4 28 0 18 4 28 0" /><path d="M2 13c10-4 18 4 28 0s18 4 28 0 18 4 28 0" /><path d="M2 22c10-4 18 4 28 0s18 4 28 0 18 4 28 0" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactChannels({ section, settings, slots }: ContactSectionProps) {
  const fields = section.fields
  const featuredImage = slots['contact.featured']
  return (
    <section className="postal-desk" id="cara-kirim" aria-labelledby="channels-title">
      <div className="postal-shell">
        <div className="postal-desk-heading">
          <p className="postal-eyebrow">{fields.kicker}</p>
          <h2 id="channels-title">{fields.titleLine1}<br />{fields.titleLine2} <em>{fields.titleEmphasis}</em></h2>
          <p>{fields.lead}</p>
        </div>
        <div className="postal-mail-grid">
          <a className="mail-item mail-postcard" href={instagramUrl(settings)} target="_blank" rel="noreferrer">
            <figure>
              <Image src={featuredImage.url} alt={featuredImage.alt} fill sizes="(max-width: 1024px) 100vw, 56vw" style={{ objectPosition: `${featuredImage.focalPointX}% ${featuredImage.focalPointY}%` }} />
              <figcaption>{fields.instagramImageLine1}<strong>{fields.instagramImageLine2}</strong></figcaption>
              <span className="mail-postcard-stamp" aria-hidden="true"><b>IG</b></span>
            </figure>
            <div className="mail-item-meta">
              <span>{fields.instagramKicker}</span><h3>{fields.instagramTitle} — {instagramLabel(settings)}</h3><p>{fields.instagramBody}</p><b>{fields.instagramAction} <i aria-hidden="true">↗</i></b>
            </div>
          </a>
          <Link className="mail-item mail-envelope" href="/aspirasi">
            <div className="envelope-flap" aria-hidden="true" /><span className="envelope-seal" aria-hidden="true">TRE</span>
            <div className="mail-item-meta">
              <span>{fields.aspirationKicker}</span><h3>{fields.aspirationTitle}</h3><p>{fields.aspirationBody}</p>
              <div className="envelope-lines" aria-hidden="true"><span>{fields.aspirationAddress}</span><i /><i /></div>
              <b>{fields.aspirationAction} <i aria-hidden="true">→</i></b>
            </div>
          </Link>
          <a className="mail-item mail-address" href={settings.website} target="_blank" rel="noreferrer">
            <div className="mail-address-block"><span>{fields.websiteKicker}</span><h3>{settings.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</h3><p>{fields.websiteBody}</p></div>
            <i className="mail-address-route" aria-hidden="true" />
            <div className="mail-address-coords"><b>{instagramLabel(settings)}</b><span>Instagram{settings.x ? ' · X' : ''}<br />{fields.websiteAction} ↗</span></div>
          </a>
        </div>
      </div>
    </section>
  )
}

function ContactPostscript({ section }: ContactSectionProps) {
  const fields = section.fields
  return (
    <section className="postal-ps" aria-labelledby="ps-title">
      <div className="postal-ps-shell">
        <span className="postal-ps-mark" aria-hidden="true">{fields.mark}</span>
        <h2 id="ps-title">{fields.titlePrefix} <em>{fields.titleEmphasis}</em></h2>
        <p>{fields.body}</p>
      </div>
    </section>
  )
}

export default async function ContactPage() {
  const [slots, settings, content] = await Promise.all([getPublicMediaSlots(), getSiteSettings(), getPageContent('contact')])
  const sections = [...content.sections].filter((section) => section.visible).sort((first, second) => first.order - second.order)

  return (
    <PublicPageFrame activeHref="/kontak">
      {sections.map((section) => {
        const props = { section, settings, slots }
        if (section.id === 'hero') return <ContactHero {...props} key={section.id} />
        if (section.id === 'channels') return <ContactChannels {...props} key={section.id} />
        if (section.id === 'postscript') return <ContactPostscript {...props} key={section.id} />
        return null
      })}
    </PublicPageFrame>
  )
}
