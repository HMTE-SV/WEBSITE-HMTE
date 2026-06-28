'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { siteNav } from '@/data/site-content'

type HeaderProps = {
  activeHref?: string
  variant?: 'floating' | 'landing'
}

export function Header({ activeHref = '/', variant = 'floating' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  // Tint + blur the bar once the page scrolls past the hero, matching the
  // floating-over-content treatment the static prototype used.
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 80)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close an open dropdown on Escape or a click outside the nav (touch/click path;
  // desktop hover/focus is handled in CSS).
  useEffect(() => {
    if (!openGroup) {
      return
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenGroup(null)
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [openGroup])

  function closeAll() {
    setIsMenuOpen(false)
    setOpenGroup(null)
  }

  const baseClassName = variant === 'landing' ? 'tre-header header-landing' : 'tre-header'
  const headerClassName = isScrolled ? `${baseClassName} header-scrolled` : baseClassName

  return (
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
        <nav
          id="main-navigation"
          ref={navRef}
          className={isMenuOpen ? 'is-open' : undefined}
          aria-label="Navigasi utama"
        >
          {siteNav.map((item) => {
            if (!item.children) {
              const isActive = item.href === activeHref

              return (
                <Link
                  href={item.href ?? '/'}
                  className={isActive ? 'active' : undefined}
                  key={item.label}
                  onClick={closeAll}
                >
                  {item.label}
                </Link>
              )
            }

            const isGroupActive = item.children.some((child) => child.href === activeHref)
            const isOpen = openGroup === item.label

            return (
              <div className={isOpen ? 'nav-group is-open' : 'nav-group'} key={item.label}>
                <button
                  type="button"
                  className={isGroupActive ? 'nav-group-trigger active' : 'nav-group-trigger'}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup((current) => (current === item.label ? null : item.label))}
                >
                  {item.label}
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="nav-submenu">
                  {item.children.map((child) => (
                    <Link
                      href={child.href}
                      className={child.href === activeHref ? 'active' : undefined}
                      key={child.href}
                      onClick={closeAll}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
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
  )
}
