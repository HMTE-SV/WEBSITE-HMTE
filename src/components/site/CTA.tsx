import { ctaContent } from '@/data/site-content'

export function CTA() {
  return (
    <section className="tre-cta" id="daftar">
      <div className="cta-shell">
        <div className="cta-left fade-up">
          <div className="cta-tag">
            <span className="ct-num">{ctaContent.sectionNumber}</span>
            <span className="ct-line"></span>
            <span>{ctaContent.kicker}</span>
          </div>
          <h2 className="cta-h2">
            {ctaContent.titleLineOne}
            <br />
            <span className="muted">{ctaContent.titleMuted}</span>
            <br />
            {ctaContent.titleLineThree}
            <span className="acc">.</span>
          </h2>
        </div>
        <div className="cta-right fade-up">
          <p className="cta-p">{ctaContent.body}</p>
          <div className="cta-deadline">
            <div className="dl-label">{ctaContent.deadlineLabel}</div>
            <div className="dl-date">{ctaContent.deadlineValue}</div>
          </div>
          <div className="cta-actions">
            <a href="#" className="btn btn-primary-gold">
              {ctaContent.primaryAction}{' '}
              <svg
                width="14"
                height="14"
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
            <a href="#" className="btn btn-secondary-dark">
              {ctaContent.secondaryAction}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
