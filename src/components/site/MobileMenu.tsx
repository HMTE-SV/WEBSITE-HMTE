'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'

/*
 * Menu layar kecil: satu lembar (sheet) yang dibuka dari tombol menu di header
 * maupun dari "Lainnya" di BottomNav. Keduanya berbagi satu keadaan lewat
 * konteks ini, jadi tidak pernah ada dua menu terbuka bersamaan.
 *
 * Dibangun di atas <dialog> + showModal(), bukan div yang ditumpuk:
 * peramban sudah memberi perangkap fokus, Escape, latar yang inert untuk
 * pembaca layar, dan pengembalian fokus ke tombol pemicu saat ditutup.
 * Menulis ulang semua itu dengan tangan adalah sumber bug aksesibilitas
 * paling umum pada menu seluler.
 */

type MobileMenuContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null)

// Header juga dipakai di pratinjau panel admin yang tidak dibungkus provider.
// Di sana tombol menu cukup tidak melakukan apa-apa, bukan melempar galat.
const inertMenu: MobileMenuContextValue = { isOpen: false, open: () => {}, close: () => {}, toggle: () => {} }

export function useMobileMenu() {
  return useContext(MobileMenuContext) ?? inertMenu
}

export const MOBILE_MENU_ID = 'mobile-menu-sheet'

function isCurrent(pathname: string, href: string) {
  if (!href.startsWith('/') || href.includes('#')) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])
  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
      <MobileMenuSheet isOpen={isOpen} onClose={close} />
    </MobileMenuContext.Provider>
  )
}

function MobileMenuSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const navigatingRef = useRef(false)
  const pathname = usePathname() ?? '/'
  const settings = useSiteSettings()
  const navigation = settings.navigation.filter((item) => item.visible)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      // Selalu terisi saat dibuka (paling tidak <body>), jadi `null` berarti
      // fokus sudah diurus dan penutupan berikutnya tidak menyentuhnya lagi.
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
      dialog.showModal()
      document.documentElement.classList.add('has-mobile-menu')
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Pindah halaman lewat tombol kembali/maju juga harus menutup menu.
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  function handleClose() {
    document.documentElement.classList.remove('has-mobile-menu')
    onClose()
    restoreFocus()
  }

  /*
   * <dialog> mengembalikan fokus ke elemen yang fokus sebelum dibuka, tapi
   * Safari tidak memfokuskan tombol yang diketuk. Tanpa ini, pengguna pembaca
   * layar di iPhone mendarat di awal halaman setiap kali menu ditutup.
   * Cadangannya: pemicu menu yang sedang tampak (header atau BottomNav).
   */
  function restoreFocus() {
    const previous = returnFocusRef.current
    if (!previous) return
    returnFocusRef.current = null
    // Menutup karena memilih tautan: fokus diurus perpindahan halaman.
    if (navigatingRef.current) {
      navigatingRef.current = false
      return
    }
    // Ditunda satu giliran: saat tombol tutup ditekan, <dialog> baru benar-benar
    // tertutup setelah efek di atas berjalan.
    window.setTimeout(() => {
      if (previous !== document.body && previous.isConnected) {
        previous.focus()
        return
      }
      const triggers = document.querySelectorAll<HTMLElement>(`[aria-controls="${MOBILE_MENU_ID}"]`)
      Array.from(triggers).find((trigger) => trigger.offsetParent !== null)?.focus()
    }, 0)
  }

  function handleNavigate() {
    navigatingRef.current = true
    handleClose()
  }

  // Ketukan di latar gelap (di luar panel) menutup menu.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) handleClose()
  }

  return (
    <dialog
      ref={dialogRef}
      id={MOBILE_MENU_ID}
      className="mnav-sheet"
      aria-label="Menu navigasi"
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      <div className="mnav-panel">
        <div className="mnav-head">
          <span className="mnav-grip" aria-hidden="true" />
          <p className="mnav-title">Menu</p>
          <button type="button" className="mnav-close" onClick={handleClose} aria-label="Tutup menu">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="mnav-body" aria-label="Navigasi utama">
          {navigation.map((item) => {
            const visibleChildren = item.children.filter((child) => child.visible)

            if (visibleChildren.length === 0) {
              return (
                <Link
                  key={item.id}
                  href={item.href || '/'}
                  className="mnav-link mnav-link--top"
                  aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}
                  onClick={handleNavigate}
                >
                  {item.label}
                </Link>
              )
            }

            const headingId = `mnav-group-${item.id}`
            return (
              <section className="mnav-group" key={item.id} aria-labelledby={headingId}>
                <h2 className="mnav-group-title" id={headingId}>{item.label}</h2>
                <ul>
                  {visibleChildren.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className="mnav-link"
                        aria-current={isCurrent(pathname, child.href) ? 'page' : undefined}
                        onClick={handleNavigate}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </nav>

        {settings.headerCtaVisible ? (
          <div className="mnav-foot">
            <Link href={settings.headerCtaHref} className="mnav-cta" onClick={handleNavigate}>
              {settings.headerCtaLabel}
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}
