import { footerColumns, footerContent } from '@/data/site-content'

export function Footer() {
  return (
    <footer className="tre-footer" id="site-footer">
      <div className="container">
        <div className="top">
          <div className="col">
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
