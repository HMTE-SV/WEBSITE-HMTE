'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { MOBILE_MENU_ID, useMobileMenu } from '@/components/site/MobileMenu'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'

/*
 * Navigasi bawah: kapsul melayang untuk jempol.
 *
 * Komponen ini selalu ada di DOM, tapi CSS menyembunyikannya kecuali di
 * aplikasi terpasang (css/mobile-nav.css) dan di beranda browser HP
 * (css/home-aurora.css). Keputusan tampil/tidaknya sengaja di CSS, bukan
 * matchMedia di JS, supaya tidak ada kedip saat hidrasi.
 */

type BottomNavKey = 'beranda' | 'kabar' | 'acara' | 'program' | 'organisasi' | 'lainnya'

type BottomNavItem = {
  key: BottomNavKey
  label: string
  icon: ReactNode
  /** Tautan tujuan. Tanpa href, item membuka lembar menu. */
  href?: string
  /** id grup di settings.navigation yang anak-anaknya ikut menandai item ini aktif. */
  navGroupId?: string
  /** Rute tambahan yang juga dianggap bagian dari item ini. */
  alsoMatches?: string[]
  /**
   * Slot yang disiapkan tapi belum dibuka. "Acara" menunggu fitur
   * pendaftaran/presensi; begitu rutenya ada, cukup ubah jadi false.
   */
  hidden?: boolean
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const ITEMS: BottomNavItem[] = [
  {
    key: 'beranda',
    label: 'Beranda',
    href: '/',
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>,
  },
  {
    key: 'kabar',
    label: 'Kabar',
    href: '/berita',
    navGroupId: 'news',
    icon: <svg viewBox="0 0 24 24" {...stroke}><path d="M5 5h11v14H6a1 1 0 0 1-1-1z" /><path d="M16 9h3v9a1 1 0 0 1-1 1h-2" /><path d="M8 9h5M8 12.5h5M8 16h3" /></svg>,
  },
  {
    key: 'acara',
    label: 'Acara',
    href: '/acara',
    hidden: true,
    icon: <svg viewBox="0 0 24 24" {...stroke}><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>,
  },
  {
    key: 'program',
    label: 'Program',
    href: '/program-kerja',
    icon: <svg viewBox="0 0 24 24" {...stroke}><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><path d="M16.5 13v7M13 16.5h7" /></svg>,
  },
  {
    key: 'organisasi',
    label: 'Organisasi',
    href: '/kepengurusan',
    navGroupId: 'organization',
    alsoMatches: ['/divisi', '/pengurus'],
    icon: <svg viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="7.5" r="3" /><path d="M6.5 19.5a5.5 5.5 0 0 1 11 0" /><circle cx="5" cy="10" r="2" /><circle cx="19" cy="10" r="2" /></svg>,
  },
  {
    key: 'lainnya',
    label: 'Lainnya',
    icon: <svg viewBox="0 0 24 24" {...stroke}><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></svg>,
  },
]

function matches(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function BottomNav() {
  const pathname = usePathname() ?? '/'
  const settings = useSiteSettings()
  const mobileMenu = useMobileMenu()

  function isActive(item: BottomNavItem) {
    if (!item.href) return false
    const group = item.navGroupId ? settings.navigation.find((navItem) => navItem.id === item.navGroupId) : undefined
    // Anak grup yang sudah punya item sendiri (mis. Program Kerja) tidak ikut
    // menyalakan item grupnya, supaya hanya satu pil yang aktif.
    const ownedElsewhere = new Set(ITEMS.filter((other) => other !== item && other.href).map((other) => other.href))
    const routes = [
      item.href,
      ...(group?.children
        .filter((child) => child.href.startsWith('/') && !ownedElsewhere.has(child.href))
        .map((child) => child.href) ?? []),
      ...(item.alsoMatches ?? []),
    ]
    return routes.some((route) => matches(pathname, route))
  }

  const visibleItems = ITEMS.filter((item) => !item.hidden)

  return (
    <nav className="bnav" aria-label="Navigasi aplikasi" style={{ '--bnav-count': visibleItems.length } as CSSProperties}>
      {visibleItems.map((item) => {
        if (!item.href) {
          return (
            <button
              key={item.key}
              type="button"
              className="bnav-item"
              aria-haspopup="dialog"
              aria-expanded={mobileMenu.isOpen}
              aria-controls={MOBILE_MENU_ID}
              onClick={mobileMenu.open}
            >
              <span className="bnav-icon" aria-hidden="true">{item.icon}</span>
              <span className="bnav-label">{item.label}</span>
            </button>
          )
        }

        const active = isActive(item)
        return (
          <Link
            key={item.key}
            href={item.href}
            className="bnav-item"
            aria-current={active ? 'page' : undefined}
          >
            <span className="bnav-icon" aria-hidden="true">{item.icon}</span>
            <span className="bnav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
