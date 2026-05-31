function Partners() {
  const partners = [
    { n: "PLN",              kind: "BUMN" },
    { n: "Indonesia Power",  kind: "BUMN" },
    { n: "Schneider",        kind: "GLOBAL" },
    { n: "Parama Data",      kind: "INDUSTRI" },
    { n: "PJB",              kind: "BUMN" },
    { n: "Pertamina",        kind: "BUMN" },
    { n: "Astra",            kind: "INDUSTRI" },
    { n: "ESDM",             kind: "PEMERINTAH" },
  ];
  return (
    <section className="tre-section light tre-partners" data-screen-label="Partners">
      <div className="partners-shell">

        <div className="partners-head">
          <div className="partners-tag">
            <span>04</span><i></i><em>INDUSTRI MITRA</em>
          </div>
          <h2 className="partners-h2">
            Engineering for the<br/>
            <span className="muted">infrastructure of</span><br/>
            a nation<span className="acc">.</span>
          </h2>
          <p className="partners-lead">
            Kerja sama langsung dengan perusahaan nasional yang membangun dan mengoperasikan infrastruktur kelistrikan Indonesia. Pertukaran ke Jepang, China, dan Korea.
          </p>
        </div>

        <div className="partners-grid">
          {partners.map((p, i) => (
            <div className="partner-cell" key={p.n}>
              <div className="p-num">{String(i+1).padStart(2,"0")}</div>
              <div className="p-name">{p.n}</div>
              <div className="p-kind">{p.kind}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Partners = Partners;
