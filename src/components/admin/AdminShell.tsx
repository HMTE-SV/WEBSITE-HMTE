import Link from 'next/link'
import { AdminLogoutButton } from './AdminLogoutButton'
import { getAdminNavItemsForRole } from '@/data/admin-nav'
import type { AdminRole } from '@/types/admin'

type AdminShellProps = {
  activeHref: string
  children: React.ReactNode
  description?: string
  kicker: string
  role?: AdminRole
  title: string
}

export function AdminShell({
  activeHref,
  children,
  description,
  kicker,
  role = 'superadmin',
  title,
}: AdminShellProps) {
  const navItems = getAdminNavItemsForRole(role)

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div>
          <span className="admin-kicker">HMTE TRE SV UGM</span>
          <h1>Admin</h1>
          <nav className="admin-nav">
            {navItems.map((item) => (
              <Link href={item.href} aria-current={item.href === activeHref ? 'page' : undefined} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">{kicker}</span>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <AdminLogoutButton />
        </header>
        {children}
      </section>
    </main>
  )
}
