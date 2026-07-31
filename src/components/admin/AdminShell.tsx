'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AdminIcon } from './AdminIcon'
import { AdminLogoutButton } from './AdminLogoutButton'
import { useAdminSession } from './AdminSessionContext'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { getAdminNavItemsForRole, type AdminNavItem } from '@/data/admin-nav'

type AdminShellProps = {
  activeHref: string
  children: React.ReactNode
  description?: string
  kicker: string
  title: string
}

const navigationGroups = [
  ['workspace', 'Workspace'],
  ['publikasi', 'Publikasi'],
  ['organisasi', 'Organisasi'],
  ['sistem', 'Sistem'],
] as const satisfies ReadonlyArray<readonly [AdminNavItem['group'], string]>

export function AdminShell({ activeHref, children, description, kicker, title }: AdminShellProps) {
  const logo = useMediaSlot('brand.logo.primary')
  const session = useAdminSession()
  const navItems = getAdminNavItemsForRole(session.role)
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const initials = (session.displayName || session.email)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <main className={isNavigationOpen ? 'admin-dashboard is-nav-open' : 'admin-dashboard'}>
      <aside className="admin-sidebar" aria-label="Navigasi admin" id="admin-navigation">
        <div className="admin-sidebar-main">
          <div className="admin-brand-row">
            <Link className="admin-brand" href="/admin" aria-label="Dashboard admin HMTE">
              <Image src={logo.url} alt={logo.alt} width={138} height={41} priority />
              <span>Control room</span>
            </Link>
            <button className="admin-nav-close" type="button" aria-label="Tutup navigasi" onClick={() => setIsNavigationOpen(false)}>
              ×
            </button>
          </div>

          <nav className="admin-nav">
            {navigationGroups.map(([group, groupLabel]) => {
              const groupItems = navItems.filter((item) => item.group === group)

              if (groupItems.length === 0) return null

              return (
                <div className="admin-nav-group" key={group}>
                  <span className="admin-nav-label">{groupLabel}</span>
                  {groupItems.map((item) => (
                    <Link
                      href={item.href}
                      aria-current={item.href === activeHref ? 'page' : undefined}
                      key={item.href}
                      onClick={() => setIsNavigationOpen(false)}
                    >
                      <AdminIcon name={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <span className="admin-user-avatar">{initials || 'AD'}</span>
            <span>
              <strong>{session.displayName || 'Admin HMTE'}</strong>
              <small>{session.role}</small>
            </span>
          </div>
          <Link className="admin-site-link" href="/" target="_blank" rel="noopener noreferrer">
            Buka website publik <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      <button className="admin-nav-backdrop" type="button" aria-label="Tutup navigasi" onClick={() => setIsNavigationOpen(false)} />

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-copy">
            <div className="admin-mobile-heading">
              <button className="admin-nav-toggle" type="button" aria-controls="admin-navigation" aria-expanded={isNavigationOpen} aria-label="Buka navigasi admin" onClick={() => setIsNavigationOpen(true)}>
                <span />
                <span />
                <span />
              </button>
              <span className="admin-kicker">{kicker}</span>
            </div>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-role-chip">{session.role}</span>
            <AdminLogoutButton />
          </div>
        </header>
        <div className="admin-workspace">{children}</div>
      </section>
    </main>
  )
}
