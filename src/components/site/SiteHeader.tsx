import Link from 'next/link'
import { siteNavLinks } from '@/data/site-content'
import { identity } from '@/data/organization'
import { LogoMark } from '@/components/site/Brand'

type SiteHeaderProps = {
  activeHref?: string
}

export function SiteHeader({ activeHref }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-navy bg-cloud/95 backdrop-blur">
      <div className="container-page flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="rounded-[8px] border-2 border-navy bg-cloud p-1 shadow-[4px_4px_0_#ffc83d]">
            <LogoMark size={44} className="h-11 w-11" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-black text-navy">{identity.shortOrg}</span>
            <span className="block text-xs font-extrabold uppercase text-slate">
              TRE SV UGM
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Navigasi utama">
          {siteNavLinks.map((link) => {
            const active = activeHref === link.href
            return (
              <Link
                href={link.href}
                className={`rounded-[8px] border-2 px-3 py-2 text-sm font-extrabold transition ${
                  active
                    ? 'border-navy bg-gold text-ink shadow-[3px_3px_0_#062657]'
                    : 'border-transparent text-navy hover:border-navy hover:bg-sand'
                }`}
                aria-current={active ? 'page' : undefined}
                key={link.href}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
