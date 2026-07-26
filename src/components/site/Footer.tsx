import Image from 'next/image'
import { footerColumns, footerContent } from '@/data/site-content'

export function Footer() {
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
              alt="Logo Kabinet Abya Vistara"
              width={128}
              height={128}
              className="ftr-cabinet-logo"
            />
            <span className="ftr-cabinet-name">
              <small>Kabinet</small>
              <strong>Abya Vistara</strong>
            </span>
          </div>
          <p className="ftr-masthead-note">
            Situs resmi Himpunan Mahasiswa Teknik Elektro
            <span>Sekolah Vokasi, Universitas Gadjah Mada</span>
          </p>
        </div>

        <div className="top">
          <div className="col">
            {footerContent.addressLines.map((lines) => (
              <p className="addr" key={lines.join('|')}>
                {lines.map((line, index) => (
                  <span key={line}>
                    {line}
                    {index < lines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            ))}
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
          <span>{footerContent.bottomLeft}</span>
          <span>{footerContent.bottomRight}</span>
        </div>
      </div>
    </footer>
  )
}
