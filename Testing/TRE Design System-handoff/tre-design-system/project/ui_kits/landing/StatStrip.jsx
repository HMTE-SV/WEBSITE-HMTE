function StatStrip() {
  const items = [
    { num: "2026", sub: "AKR", label: "Akreditasi UNGGUL", note: "LAM Teknik · valid 2026–2031", accent: true },
    { num: "12",   sub: "LAB", label: "Laboratorium aktif", note: "instalasi, tenaga, mesin, kontrol" },
    { num: "200", suffix: "+", sub: "PRT", label: "Industri mitra", note: "PLN · Schneider · Indonesia Power" },
    { num: "144", sub: "SKS", label: "Total beban studi", note: "8 semester · 4 tahun" },
  ];
  return (
    <section className="tre-stats" data-screen-label="Stats">
      <div className="stats-head">
        <div className="stats-eyebrow">
          <span>01</span><i></i><em>BY THE NUMBERS</em>
        </div>
        <h2 className="stats-h2">A vocational program at national scale<span className="acc">.</span></h2>
      </div>
      <div className="stats-grid">
        {items.map((it, i) => (
          <div className={"stat-cell" + (it.accent ? " accent" : "")} key={i}>
            <div className="stat-tag">{it.sub}</div>
            <div className="stat-num">
              {it.num}{it.suffix && <span className="plus">{it.suffix}</span>}
            </div>
            <div className="stat-meta">
              <div className="stat-label">{it.label}</div>
              <div className="stat-note">{it.note}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

window.StatStrip = StatStrip;
