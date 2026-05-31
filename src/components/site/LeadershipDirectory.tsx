import { divisionsByCode, leadershipDivisionOrder } from '@/data/divisions'
import { leadersByDivision } from '@/data/leaders'
import { leadershipIntro } from '@/data/site-content'

const defaultDivision = divisionsByCode.PH
const defaultMemberCount = leadersByDivision.PH.length

export function LeadershipDirectory() {
  return (
    <section className="tre-curriculum" id="kurikulum">
      <div className="curr-shell">
        <header className="curr-head fade-up">
          <div className="curr-tag">
            <span className="c-num">{leadershipIntro.sectionNumber}</span>
            <span className="c-line"></span>
            <span>{leadershipIntro.kicker}</span>
          </div>
          <h2 className="curr-h2">
            <span>{leadershipIntro.titleNumber}</span>
            <span className="big-sub">{leadershipIntro.titleLabel}</span>
          </h2>
          <p className="curr-lead">{leadershipIntro.lead}</p>
        </header>
      </div>

      <div className="curr-os-wrap fade-up">
        <div className="curr-os" aria-label="Direktori Kepengurusan HMTE">
          <div className="os-menubar">
            <div className="os-brand">
              <span className="os-dot"></span>
              Direktori Kepengurusan HMTE
            </div>
            <div className="os-status" id="kepDivLabel">
              {defaultDivision.code} · {defaultMemberCount} Anggota
            </div>
          </div>
          <div className="os-desktop os-desktop--kep">
            <aside className="os-dock os-dock--kep" id="kepDock" aria-label="Pilih bidang">
              {leadershipDivisionOrder.map((divisionCode) => {
                const division = divisionsByCode[divisionCode]
                const isActive = divisionCode === defaultDivision.code

                return (
                  <button
                    className={isActive ? 'kep-dock-btn active' : 'kep-dock-btn'}
                    role="tab"
                    data-bidang={division.code}
                    aria-selected={isActive ? 'true' : 'false'}
                    key={division.code}
                  >
                    <span className="kep-dock-abbr">{division.shortName}</span>
                    <span className="kep-dock-name">{division.name}</span>
                  </button>
                )
              })}
            </aside>

            <section className="os-window os-window--kep" aria-live="polite">
              <div className="window-top">
                <div className="window-controls" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="window-title-wrap">
                  <div className="window-title" id="kepWindowTitle">
                    {defaultDivision.code}
                  </div>
                  <div className="window-chip">{defaultMemberCount} Anggota</div>
                </div>
                <div className="window-actions">
                  <div className="search-box">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="search-icon"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      id="kepSearchInput"
                      placeholder="Cari pengurus..."
                      aria-label="Cari pengurus"
                    />
                  </div>
                  <div className="view-toggle" id="kepViewToggle" role="group" aria-label="Mode Tampilan">
                    <button className="toggle-btn active" data-view="grid" title="Tampilan Grid">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    </button>
                    <button className="toggle-btn" data-view="list" title="Tampilan Daftar">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="window-tabs" role="tablist" aria-label="Menu Direktori">
                <button className="win-tab active" role="tab" aria-selected="true" data-mode="anggota">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Daftar Anggota
                </button>
                <button className="win-tab" role="tab" aria-selected="false" data-mode="proker">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Program Kerja
                </button>
              </div>
              <div className="kep-members-grid" id="kepMembersGrid"></div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}
