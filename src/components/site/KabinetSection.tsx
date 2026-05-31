import { divisions } from '@/data/divisions'
import { kabinetIntro } from '@/data/site-content'

export function KabinetSection() {
  return (
    <section className="tre-pillars" id="pillars">
      <div className="pillars-shell">
        <header className="pillars-head fade-up">
          <div className="pillars-tag">
            <span className="p-num">{kabinetIntro.sectionNumber}</span>
            <span className="p-line"></span>
            <span>{kabinetIntro.kicker}</span>
          </div>
          <h2 className="pillars-h2">
            {kabinetIntro.title}
            <span className="muted">{kabinetIntro.mutedTitle}</span>
            <span className="acc">.</span>
          </h2>
          <p className="pillars-lead">{kabinetIntro.lead}</p>
        </header>

        <div className="kabinet-grid">
          {divisions.map((division) => (
            <article className="kabinet-card fade-up" key={division.code}>
              <div className="kabinet-card-top">
                <span className="kabinet-abbr">{division.shortName}</span>
                <span className="kabinet-num">{String(division.order).padStart(2, '0')}</span>
              </div>
              <h3 className="kabinet-name">{division.name}</h3>
              <p className="kabinet-desc">{division.description}</p>
              <div className="kabinet-footer">
                <span className="kabinet-dot"></span>
                <span>Lihat Anggota →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
