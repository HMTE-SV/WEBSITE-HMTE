'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminIcon } from './AdminIcon'
import { AdminLogoutButton } from './AdminLogoutButton'
import { useAdminSession } from './AdminSessionContext'
import { useLocalPreference } from '@/lib/admin/use-local-preference'
import { getAdminNavItemsForRole, type AdminNavItem } from '@/data/admin-nav'

/*
 * Kerangka setiap halaman admin. Spesifikasi: docs/DESIGN_ADMIN.md
 *
 * Perubahan struktural terbesar dari kerangka lama: blok judul setinggi 168px
 * di puncak halaman dihapus. Dulu yang pertama terlihat setiap kali pengurus
 * berpindah menu adalah nama menu yang baru saja ia klik sendiri. Yang
 * sebenarnya ditanyakan mata saat berpindah adalah "aku di mana, dan apa yang
 * bisa kukerjakan", jadi puncak layar sekarang berisi jejak lokasi satu baris
 * plus satu tempat tetap untuk aksi utama — dan pekerjaannya mulai lebih awal.
 */

type AdminShellProps = {
  activeHref: string
  children: React.ReactNode
  /** Aksi utama halaman. Selalu di sudut yang sama, di halaman mana pun. */
  actions?: React.ReactNode
  /** Nama halaman untuk jejak lokasi. */
  title: string
  /** Hitungan per rute, mis. { '/admin/leaders': 71 }. */
  counts?: Record<string, number>
  /**
   * USANG — dulu dipakai blok judul 168px yang sudah dihapus. Masih diterima
   * (dan diabaikan) supaya halaman bisa dipindahkan satu per satu tanpa
   * merobohkan build. Hapus prop ini dari halaman saat halamannya digarap;
   * begitu tidak ada lagi pemakainya, hapus dari sini.
   */
  kicker?: string
  description?: string
}

const navigationGroups = [
  ['workspace', 'Workspace'],
  ['publikasi', 'Publikasi'],
  ['organisasi', 'Organisasi'],
  ['sistem', 'Sistem'],
] as const satisfies ReadonlyArray<readonly [AdminNavItem['group'], string]>

const RAIL_KEY = 'hmte-adm-rail'
const GROUPS_KEY = 'hmte-adm-groups'

// Tetapan tingkat modul, bukan larik baru tiap render. Lihat useLocalPreference.
const NO_CLOSED_GROUPS: string[] = []

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  )
}

function RailIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d={collapsed ? 'm13 9 3 3-3 3' : 'm17 9-3 3 3 3'} />
    </svg>
  )
}

export function AdminShell({ activeHref, actions, children, counts, title }: AdminShellProps) {
  const router = useRouter()
  const session = useAdminSession()
  const navItems = useMemo(
    () => getAdminNavItemsForRole(session.role, session.permissions),
    [session.permissions, session.role],
  )

  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isRailCollapsed, setIsRailCollapsed] = useLocalPreference(RAIL_KEY, false)
  const [closedGroups, setClosedGroups] = useLocalPreference(GROUPS_KEY, NO_CLOSED_GROUPS)

  const initials = (session.displayName || session.email)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const toggleGroup = useCallback(
    (group: string) => {
      setClosedGroups(
        closedGroups.includes(group)
          ? closedGroups.filter((entry) => entry !== group)
          : [...closedGroups, group],
      )
    },
    [closedGroups, setClosedGroups],
  )

  /*
   * Palet dibuka dan ditutup lewat dua fungsi ini, bukan lewat setIsPaletteOpen
   * langsung. Pengosongan `query` menempel pada peristiwanya di sini; kalau
   * ditaruh di useEffect yang mengamati isPaletteOpen, ia jadi setState di
   * dalam effect — satu render tambahan tiap kali palet dibuka, dan React
   * Compiler menandainya sebagai galat.
   */
  const openPalette = useCallback(() => {
    setQuery('')
    setIsPaletteOpen(true)
  }, [])

  const closePalette = useCallback(() => {
    setQuery('')
    setIsPaletteOpen(false)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openPalette()
      }

      if (event.key === 'Escape') {
        closePalette()
        setIsNavOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openPalette, closePalette])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return navItems
    return navItems.filter((item) => item.label.toLowerCase().includes(needle))
  }, [navItems, query])

  const shellClass = [
    'adm',
    isRailCollapsed ? 'is-rail-collapsed' : '',
    isNavOpen ? 'is-nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <aside className="adm-rail" aria-label="Navigasi admin" id="adm-rail">
        <Link className="adm-rail-brand" href="/admin">
          <span className="adm-rail-brand-main">
            <span className="adm-rail-mark" aria-hidden="true">H</span>
            <span>
              <strong>HMTE</strong>
              <small>Control room</small>
            </span>
          </span>
          <span className="adm-rail-cabinet">
            <span>
              <small>Kabinet</small>
              <strong>Abya Vistara</strong>
            </span>
            <b>2026/27</b>
          </span>
        </Link>

        <button className="adm-rail-search" type="button" onClick={openPalette}>
          <SearchIcon />
          <span>Cari menu</span>
          <kbd>Ctrl K</kbd>
        </button>

        <nav className="adm-rail-nav">
          {navigationGroups.map(([group, label]) => {
            const items = navItems.filter((item) => item.group === group)
            if (items.length === 0) return null

            const isClosed = closedGroups.includes(group)
            const holdsActive = items.some((item) => item.href === activeHref)
            const groupClass = [
              'adm-rail-group',
              isClosed ? 'is-closed' : '',
              holdsActive ? 'holds-active' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <div className={groupClass} key={group}>
                <button
                  className="adm-rail-group-head"
                  type="button"
                  aria-expanded={!isClosed}
                  onClick={() => toggleGroup(group)}
                >
                  <ChevronIcon />
                  {label}
                </button>

                <div className="adm-rail-list">
                  {items.map((item) => (
                    <Link
                      href={item.href}
                      aria-current={item.href === activeHref ? 'page' : undefined}
                      key={item.href}
                      onClick={() => setIsNavOpen(false)}
                      title={item.label}
                    >
                      <AdminIcon name={item.icon} />
                      <span>{item.label}</span>
                      {counts?.[item.href] === undefined ? null : (
                        <span className="adm-rail-count">{counts[item.href]}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="adm-rail-user">
          <span className="adm-rail-avatar" aria-hidden="true">{initials || 'AD'}</span>
          <div>
            <strong>{session.displayName || 'Admin HMTE'}</strong>
            <small>{session.role === 'editor' ? 'Operator' : session.role === 'superadmin' ? 'Superadmin' : 'Viewer'}</small>
          </div>
        </div>
      </aside>

      {isNavOpen ? (
        <button className="adm-scrim" type="button" aria-label="Tutup navigasi" onClick={() => setIsNavOpen(false)} />
      ) : null}

      <div className="adm-main">
        <header className="adm-topbar">
          <button
            className="adm-btn adm-btn--ghost adm-btn--icon adm-rail-toggle"
            type="button"
            aria-controls="adm-rail"
            aria-expanded={isNavOpen}
            aria-label="Buka navigasi"
            onClick={() => setIsNavOpen(true)}
          >
            <RailIcon collapsed />
          </button>

          <div className="adm-crumb">
            <Link href="/admin">Control room</Link>
            <span aria-hidden="true">/</span>
            <strong>{title}</strong>
          </div>

          <div className="adm-topbar-actions">
            <button
              className="adm-btn adm-btn--ghost adm-btn--icon"
              type="button"
              aria-label={isRailCollapsed ? 'Lebarkan navigasi' : 'Ciutkan navigasi'}
              title={isRailCollapsed ? 'Lebarkan navigasi' : 'Ciutkan navigasi'}
              onClick={() => setIsRailCollapsed(!isRailCollapsed)}
            >
              <RailIcon collapsed={isRailCollapsed} />
            </button>
            {actions}
            <div className="adm-topbar-user">
              <span className="adm-rail-avatar" aria-hidden="true">{initials || 'AD'}</span>
              <span>
                <strong>{session.displayName || 'Admin HMTE'}</strong>
                <small>{session.role === 'editor' ? 'Operator' : session.role === 'superadmin' ? 'Superadmin' : 'Viewer'}</small>
              </span>
              <AdminLogoutButton />
            </div>
          </div>
        </header>

        <main className="adm-work">{children}</main>
      </div>

      {isPaletteOpen ? (
        <>
          <button className="adm-scrim" type="button" aria-label="Tutup pencarian" onClick={closePalette} />
          <div className="adm-palette" role="dialog" aria-modal="true" aria-label="Cari menu">
            {/*
              autoFocus, bukan useEffect yang memanggil .focus(). Isian ini baru
              dipasang saat palet dibuka, jadi peramban sudah punya titik yang
              tepat untuk menaruh kursor tanpa render tambahan.
            */}
            <input
              autoFocus
              type="text"
              value={query}
              placeholder="Cari menu…"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && matches[0]) {
                  closePalette()
                  router.push(matches[0].href)
                }
              }}
            />
            <div className="adm-palette-list">
              {matches.length === 0 ? (
                <p className="adm-palette-empty">Tidak ada menu bernama itu.</p>
              ) : (
                matches.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    onClick={closePalette}
                  >
                    <AdminIcon name={item.icon} />
                    {item.label}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
