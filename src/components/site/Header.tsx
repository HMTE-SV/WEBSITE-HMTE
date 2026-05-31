import Link from 'next/link'
import { siteNavLinks } from '@/data/site-content'

type HeaderProps = {
  activeHref?: string
}

export function Header({ activeHref = '/' }: HeaderProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>

      <header className="tre-header">
        <div className="container">
          <div className="brand">
            <div className="bar"></div>
            <div>
              <div className="wordmark">HMTE</div>
            </div>
            <div className="sub">TRE·SV·UGM</div>
          </div>
          <nav>
            {siteNavLinks.map((link) => (
              <Link href={link.href} className={link.href === activeHref ? 'active' : undefined} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/kontak" className="hdr-cta">
            Hubungi{' '}
            <svg
              width="12"
              height="12"
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
        </div>
      </header>
    </>
  )
}
