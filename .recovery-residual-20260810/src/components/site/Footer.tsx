import Image from 'next/image'
import { getSiteSettings } from '@/lib/site-settings-data'
import { formatCabinetTitle, formatPeriodTitle, instagramLabel, resolveFooterHref } from '@/lib/site-settings'
import { getPublicMediaSlots } from '@/lib/media-slot-data'

/*
 * Kaki halaman membaca pengaturan situs, bukan konstanta.
 *
 * Nama kabinet, periode, dan tahun hak cipta dulu tertulis tiga kali di
 * src/data/site-content.ts, dan pergantian kepengurusan berarti menyunting kode
 * lalu deploy ulang. Sekarang ketiganya datang dari settings/site, yang bisa
 * diubah superadmin dari /admin/settings. Pembacaannya tidak pernah gagal:
 * getSiteSettings() jatuh ke nilai bawaan yang sama dengan teks lama.
 *
 * Masthead dan daftar tautan juga mengikuti versi terbit. Tautan kanal dapat
 * mengacu ke satu sumber (Instagram, email, website, LinkedIn, atau X), supaya
 * pergantian akun tidak perlu diedit lagi di setiap kolom.
 */
export async function Footer() {
  const [settings, slots] = await Promise.all([getSiteSettings(), getPublicMediaSlots()])
  const cabinetTitle = formatCabinetTitle(settings)
  const logo = slots['brand.logo.primary']
  const cabinetLogo = slots['cabinet.logo']

  return (
    <footer className="tre-footer" id="site-footer">
      <div className="container">
        <div className="ftr-masthead">
          <div className="ftr-lockup">
            <Image
              src={logo.url}
              alt={logo.alt}
              width={132}
              height={39}
              className="ftr-logo"
            />
            <span className="ftr-lockup-rule" aria-hidden="true" />
            <Image
              src={cabinetLogo.url}
              alt={cabinetLogo.alt || `Logo ${cabinetTitle}`}
              width={128}
              height={128}
              className="ftr-cabinet-logo"
            />
            <span className="ftr-cabinet-name">
              <small>Kabinet</small>
              <strong>{settings.cabinetName}</strong>
            </span>
          </div>
          <p className="ftr-masthead-note">
            {settings.footerMastheadNote}
            <span>{settings.footerMastheadSubnote}</span>
          </p>
        </div>

        <div className="top">
          <div className="col">
            <p className="addr">
              <span>
                {settings.organizationName}
                <br />
              </span>
              <span>{settings.address}</span>
            </p>
            <p className="addr">
              <span>
                {cabinetTitle}
                <br />
              </span>
              <span>{formatPeriodTitle(settings)}</span>
            </p>
          </div>

          {settings.footerColumns.filter((column) => column.visible).map((column) => (
            <div className="col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.filter((link) => link.visible).map((link) => {
                const href = resolveFooterHref(settings, link)
                // Items still awaiting official data render as muted, non-clickable
                // text rather than dead "#" links.
                if (!href || href === '#') {
                  return (
                    <span className="ftr-pending" key={link.label}>
                      {link.label}
                    </span>
                  )
                }

                const isExternal = link.newTab || href.startsWith('http')
                const label = link.channel === 'instagram'
                  ? instagramLabel(settings)
                  : link.label

                return (
                  <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener' : undefined}
                    key={link.label}
                  >
                    {label}
                  </a>
                )
              })}
            </div>
          ))}
        </div>
        <div className="bottom">
          <span>
            © {settings.agendaYear} HMTE TRE SV UGM · {cabinetTitle.toUpperCase()}
          </span>
          <span>{settings.closingCheer}</span>
        </div>
      </div>
    </footer>
  )
}
