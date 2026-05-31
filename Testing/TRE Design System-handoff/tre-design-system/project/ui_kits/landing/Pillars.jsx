function Pillars() {
  const items = [
    {
      n: "01",
      tag: "GEN",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      t: "Pembangkitan tenaga listrik",
      d: "Generator sinkron, turbin, sistem proteksi, dan integrasi sumber energi terbarukan. Praktik di laboratorium mesin-mesin listrik.",
      meta: ["Lab. Mesin Listrik", "Lab. Tenaga", "PLTU · PLTA · PLTS"],
    },
    {
      n: "02",
      tag: "DIS",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="6"/><rect x="2" y="16" width="6" height="6"/><rect x="16" y="16" width="6" height="6"/><path d="M5 16v-3h14v3M12 8v5"/></svg>,
      t: "Transmisi & distribusi",
      d: "Jaringan tegangan tinggi, gardu induk, sistem SCADA, dan transisi menuju smart grid yang terintegrasi.",
      meta: ["Gardu induk", "SCADA", "Smart grid"],
    },
    {
      n: "03",
      tag: "INS",
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>,
      t: "Instalasi pemanfaatan",
      d: "Instalasi industri, komersial, dan residensial. Motor control, panel daya, dan otomasi listrik bangunan.",
      meta: ["Motor control", "Panel daya", "Otomasi"],
    },
  ];
  return (
    <section className="tre-section light tre-pillars" data-screen-label="Pillars">
      <div className="pillars-shell">

        <header className="pillars-head">
          <div className="pillars-tag">
            <span>02</span><i></i><em>TIGA PILAR</em>
          </div>
          <h2 className="pillars-h2">
            Tiga kompetensi.<br/>
            <span className="muted">Satu mandat —</span><br/>
            menggerakkan listrik Indonesia<span className="acc">.</span>
          </h2>
          <p className="pillars-lead">
            Kurikulum TRE dibangun di sekitar tiga kompetensi inti yang menggerakkan infrastruktur kelistrikan nasional. Setiap pilar didukung laboratorium aktif dan kerja sama industri.
          </p>
        </header>

        <div className="pillars-grid">
          {items.map((it, idx) => (
            <article className={"pillar-card" + (idx === 1 ? " offset" : "")} key={it.n}>
              <div className="pillar-top">
                <div className="pillar-num">{it.n}</div>
                <div className="pillar-tag">{it.tag}</div>
              </div>
              <div className="pillar-icon">{it.icon}</div>
              <h3 className="pillar-title">{it.t}</h3>
              <p className="pillar-desc">{it.d}</p>
              <ul className="pillar-meta">
                {it.meta.map(m => <li key={m}>{m}</li>)}
              </ul>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Pillars = Pillars;
