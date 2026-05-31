import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Footer } from './Footer'
import { Header } from './Header'

type PublicPageFrameProps = {
  activeHref?: string
  children: ReactNode
}

type PublicPageHeaderProps = {
  kicker: string
  title: string
  lead: string
}

type PublicCardProps = {
  eyebrow?: string
  title: string
  body: string
  href?: string
  meta?: string
  image?: string
}

export function PublicPageFrame({ activeHref, children }: PublicPageFrameProps) {
  return (
    <>
      <Header activeHref={activeHref} />
      <main id="main-content" className="public-page">
        {children}
      </main>
      <Footer />
    </>
  )
}

export function PublicPageHeader({ kicker, title, lead }: PublicPageHeaderProps) {
  return (
    <section className="public-hero">
      <div className="public-shell">
        <div className="public-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
    </section>
  )
}

export function PublicSection({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="public-section">
      <div className="public-shell">
        {title ? <h2 className="public-section-title">{title}</h2> : null}
        {children}
      </div>
    </section>
  )
}

export function PublicCard({ eyebrow, title, body, href, meta, image }: PublicCardProps) {
  const isExternalLink = href?.startsWith('http')
  const content = (
    <article className="public-card">
      {image ? (
        <div className="public-card-image">
          <Image src={image.startsWith('/') ? image : `/${image}`} alt={title} width={1200} height={675} />
        </div>
      ) : null}
      <div className="public-card-body">
        {eyebrow ? <span className="public-card-eyebrow">{eyebrow}</span> : null}
        <h3>{title}</h3>
        <p>{body}</p>
        {meta ? <span className="public-card-meta">{meta}</span> : null}
      </div>
    </article>
  )

  if (!href) {
    return content
  }

  return (
    <Link
      className="public-card-link"
      href={href}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noopener noreferrer' : undefined}
    >
      {content}
    </Link>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="public-empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  )
}
