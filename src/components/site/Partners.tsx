import { partnersIntro, partnerTiles } from '@/data/site-content'

function getPartnerStatusClass(status: string) {
  if (status === 'Terkonfirmasi') {
    return 'is-confirmed'
  }

  if (status === 'Indikasi' || status === 'Publik awal') {
    return 'is-indicated'
  }

  return 'is-pending'
}

function PartnerTileList() {
  return (
    <div className="logo-set">
      {partnerTiles.map((tile, index) => (
        <div className={`logo-tile ${getPartnerStatusClass(tile.status)}`} key={tile.label}>
          <strong>{String(index + 1).padStart(2, '0')}</strong>
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

        <div className="partners-metrics fade-up" aria-label="Ringkasan status jejaring HMTE">
          <div>
            <span>{partnerTiles.length}</span>
            <em>Node jejaring</em>
          </div>
          <div>
            <span>{partnerTiles.filter((tile) => tile.status === 'Terkonfirmasi').length}</span>
            <em>Terkonfirmasi</em>
          </div>
          <div>
            <span>{partnerTiles.filter((tile) => tile.status !== 'Terkonfirmasi').length}</span>
            <em>Perlu dikunci</em>
          </div>
        </div>

        <div className="partner-logo-wall fade-up" aria-label="Area jejaring HMTE">
          <PartnerTileList />
        </div>
      </div>
    </section>
  )
}
