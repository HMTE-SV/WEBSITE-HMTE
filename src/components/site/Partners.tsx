import { partnersIntro, partnerTiles } from '@/data/site-content'

function PartnerTileList() {
  return (
    <div className="logo-set">
      {partnerTiles.map((tile, index) => (
        <div className="logo-tile" key={tile.label}>
          <strong>{String(index + 1).padStart(2, '0')}</strong>
          <span>{tile.label}</span>
          <em>{tile.role}</em>
        </div>
      ))}
    </div>
  )
}

export function Partners() {
  return (
    <section className="tre-partners" id="mitra">
      <div className="partners-shell">
        <div className="partners-head fade-up">
          <h2 className="partners-h2">
            {partnersIntro.titleLineOne}
            <br />
            <span className="muted">{partnersIntro.titleMuted}</span>
            <br />
            {partnersIntro.titleLineThree}
            <span className="acc">.</span>
          </h2>
          <p className="partners-lead">{partnersIntro.lead}</p>
        </div>

        <div className="partner-logo-wall fade-up" aria-label="Jejaring HMTE">
          <PartnerTileList />
        </div>
      </div>
    </section>
  )
}
