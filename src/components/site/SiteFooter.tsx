import Link from 'next/link'
import { footerColumns } from '@/data/site-content'
import { identity } from '@/data/organization'
import { LogoMark } from '@/components/site/Brand'

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-navy bg-navy text-haze">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] border-2 border-cloud bg-cloud p-1 shadow-[4px_4px_0_#ffc83d]">
                <LogoMark size={48} className="h-12 w-12" />
              </div>
              <div className="leading-tight">
                <p className="font-black text-cloud">HMTE</p>
                <p className="text-[0.72rem] font-extrabold uppercase text-haze">
                  TRE - SV UGM
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm font-medium leading-relaxed text-haze/90">
              {identity.org}, {identity.program}, {identity.faculty} {identity.university}.
            </p>
            <p className="mt-4 inline-flex rounded-full bg-gold px-3 py-1 text-sm font-extrabold text-ink">
              {identity.motto}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[0.72rem] font-black uppercase text-gold">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => {
                  const external = link.href.startsWith('http')
                  return (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        {...(external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-haze transition-colors hover:text-cloud"
                      >
                        {link.label}
                        {external ? (
                          <span className="opacity-0 transition-opacity group-hover:opacity-70" aria-hidden="true">
                            -&gt;
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-haze/75">
            &copy; {new Date().getFullYear()} HMTE TRE SV UGM - Sekolah Vokasi Universitas Gadjah Mada
          </p>
          <a
            href={identity.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-haze transition-colors hover:text-cloud"
          >
            {identity.instagramHandle}
          </a>
        </div>
      </div>
    </footer>
  )
}
