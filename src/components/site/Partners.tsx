import { partnersIntro, partnerTiles } from '@/data/site-content'

function PartnerTileList({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="logo-set" aria-hidden={hidden ? 'true' : undefined}>
      {partnerTiles.map((tile) => (
        <div className="logo-tile" key={tile.label}>
          <span>{tile.label}</span>
          <em>{tile.status}</em>
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
          <div className="partners-tag">
            <span className="p-num">{partnersIntro.sectionNumber}</span>
            <span>{partnersIntro.kicker}</span>
          </div>
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

        <div className="partner-logo-wall fade-up" aria-label="Area jejaring HMTE">
          <div className="logo-track">
            <PartnerTileList />
            <PartnerTileList hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
