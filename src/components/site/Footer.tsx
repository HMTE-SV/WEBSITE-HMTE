import { footerColumns, footerContent } from '@/data/site-content'

export function Footer() {
  return (
    <footer className="tre-footer" id="kontak">
      <div className="container">
        <div className="top">
          <div className="col">
            <div className="ftr-colophon-num" aria-hidden="true">07</div>
            <div className="ftr-brand">
              <div className="ftr-bar"></div>
              <div className="ftr-wordmark">{footerContent.wordmark}</div>
            </div>
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
          <span className="ftr-bottom-index">{footerContent.bottomRight}</span>
        </div>
      </div>
    </footer>
  )
}
