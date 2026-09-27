'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { MOBILE_MENU_ID, useMobileMenu } from '@/components/site/MobileMenu'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'

type HeaderProps = {
  activeHref?: string
  variant?: 'floating' | 'landing'
  /** Isi tambahan di ujung kanan bilah (dipakai beranda untuk lencana kabinet). */
  aside?: ReactNode
}

export function Header({ activeHref = '/', variant = 'floating', aside }: HeaderProps) {
  const logo = useMediaSlot('brand.logo.primary')
  const settings = useSiteSettings()
  const navigation = settings.navigation.filter((item) => item.visible)
  const mobileMenu = useMobileMenu()
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
    setOpenGroup(null)
  }

  const baseClassName = variant === 'landing' ? 'tre-header header-landing' : 'tre-header'
  const headerClassName = isScrolled ? `${baseClassName} header-scrolled` : baseClassName

  return (
    <header className={headerClassName}>
      <div className="container">
        <Link href="/" className="brand" aria-label="HMTE TRE SV UGM — Beranda" onClick={closeAll}>
          <Image
            src={logo.url}
            alt={logo.alt}
            width={96}
            height={28}
            className="brand-logo"
            priority
          />
        </Link>
        {/*
          Di layar kecil, nav di bawah ini disembunyikan CSS dan tombol ini
          membuka lembar menu (MobileMenu.tsx) yang dirender sekali di root
          layout. Nav desktop tetap apa adanya.
        */}
        <button
          type="button"
          className="mobile-menu-button"
          aria-haspopup="dialog"
          aria-expanded={mobileMenu.isOpen}
          aria-controls={MOBILE_MENU_ID}
          aria-label="Buka menu navigasi"
          onClick={mobileMenu.open}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
        <nav
          id="main-navigation"
          ref={navRef}
          aria-label="Navigasi utama"
        >
          {navigation.map((item) => {
            const visibleChildren = item.children.filter((child) => child.visible)
            if (visibleChildren.length === 0) {
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

            const isGroupActive = visibleChildren.some((child) => child.href === activeHref)
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
                  {visibleChildren.map((child) => (
                    <Link
                      href={child.href}
                      className={child.href === activeHref ? 'active' : undefined}
                      key={child.id}
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
        {aside}
        {settings.headerCtaVisible ? (
          <Link href={settings.headerCtaHref} className="hdr-cta">
            {settings.headerCtaLabel}{' '}
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
        ) : null}
      </div>
    </header>
  )
}
