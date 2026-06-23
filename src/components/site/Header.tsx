'use client'

import { useState } from 'react'
import Link from 'next/link'
import { siteNavLinks } from '@/data/site-content'

type HeaderProps = {
  activeHref?: string
  variant?: 'floating' | 'landing'
}

export function Header({ activeHref = '/', variant = 'floating' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const headerClassName = variant === 'landing' ? 'tre-header header-landing' : 'tre-header'

  return (
    <>
      <header className={headerClassName}>
        <div className="container">
          <div className="brand">
            <div className="bar"></div>
            <div>
              <div className="wordmark">HMTE</div>
            </div>
            <div className="sub">TRE·SV·UGM</div>
          </div>
          <button
            type="button"
            className="mobile-menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
            aria-label={isMenuOpen ? 'Tutup navigasi utama' : 'Buka navigasi utama'}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </button>
          <nav id="main-navigation" className={isMenuOpen ? 'is-open' : undefined} aria-label="Navigasi utama">
            {siteNavLinks.map((link) => (
              <Link
                href={link.href}
                className={link.href === activeHref ? 'active' : undefined}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
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
