import Image from 'next/image'
import { footerColumns, footerContent } from '@/data/site-content'
import { getSiteSettings } from '@/lib/site-settings-data'
import { formatCabinetTitle, formatPeriodTitle } from '@/lib/site-settings'

/*
 * Kaki halaman membaca pengaturan situs, bukan konstanta.
 *
 * Nama kabinet, periode, dan tahun hak cipta dulu tertulis tiga kali di
 * src/data/site-content.ts, dan pergantian kepengurusan berarti menyunting kode
 * lalu deploy ulang. Sekarang ketiganya datang dari settings/site, yang bisa
 * diubah superadmin dari /admin/settings. Pembacaannya tidak pernah gagal:
 * getSiteSettings() jatuh ke nilai bawaan yang sama dengan teks lama.
 *
 * Daftar tautan sengaja TIDAK ikut pindah. Isinya rute situs, bukan identitas
 * kepengurusan, dan rute berubah bersama kode, bukan bersama kabinet.
 */
export async function Footer() {
  const settings = await getSiteSettings()
  const cabinetTitle = formatCabinetTitle(settings)

  return (
    <footer className="tre-footer" id="site-footer">
      <div className="container">
        <div className="ftr-masthead">
          <div className="ftr-lockup">
            <Image
              src="/assets/logo-hmte.svg"
              alt="HMTE TRE SV UGM"
              width={132}
              height={39}
              className="ftr-logo"
            />
            <span className="ftr-lockup-rule" aria-hidden="true" />
            <Image
              src="/assets/abya-vistara/logo-kabinet.webp"
              alt={`Logo ${cabinetTitle}`}
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
            Situs resmi Himpunan Mahasiswa Teknik Elektro
            <span>Sekolah Vokasi, Universitas Gadjah Mada</span>
          </p>
        </div>

        <div className="top">
          <div className="col">
            <p className="addr">
              <span>
                {footerContent.organizationName}
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

          {footerColumns.map((column) => (
            <div className="col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map((link) => {
                // Items still awaiting official data render as muted, non-clickable
                // text rather than dead "#" links.
                if (link.href === '#') {
                  return (
                    <span className="ftr-pending" key={link.label}>
                      {link.label}
                    </span>
                  )
                }

                const isExternal = link.href.startsWith('http')

                return (
                  <a
                    href={link.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener' : undefined}
                    key={link.label}
                  >
                    {link.label}
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
