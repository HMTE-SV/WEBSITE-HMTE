import { siteNavLinks } from '@/data/site-content'

export function Header() {
  return (
    <>
      <a className="skip-link" href="#hero">
        Lewati ke konten
      </a>

      <header className="tre-header">
        <div className="container">
          <div className="brand">
            <div className="bar"></div>
            <div>
              <div className="wordmark">HMTE</div>
            </div>
            <div className="sub">TRE·SV·UGM</div>
          </div>
          <nav>
            {siteNavLinks.map((link, index) => (
              <a href={link.href} className={index === 0 ? 'active' : undefined} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a href="#daftar" className="hdr-cta">
            Hubungi{' '}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </header>
    </>
  )
}
