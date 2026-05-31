function Hero() {
  return (
    <section className="tre-hero" data-screen-label="Hero">
      <div className="hero-grid">

        {/* Left rail — section index */}
        <aside className="hero-rail">
          <div className="rail-line"></div>
          <div className="rail-marks">
            <div className="mark active"><span>00</span><em>HERO</em></div>
            <div className="mark"><span>01</span><em>STATS</em></div>
            <div className="mark"><span>02</span><em>PILLARS</em></div>
            <div className="mark"><span>03</span><em>KURIKULUM</em></div>
            <div className="mark"><span>04</span><em>MITRA</em></div>
          </div>
        </aside>

        {/* Main editorial column */}
        <div className="hero-main">
          <div className="hero-eyebrow">
            <span className="dot"></span>
            <span>SARJANA TERAPAN · D4 · SEKOLAH VOKASI UGM</span>
            <span className="hero-eyebrow-meta">/ 2026 / YOGYAKARTA</span>
          </div>

          <h1 className="hero-h1">
            <span className="line">Engineers</span>
            <span className="line line-shift">Indonesia can</span>
            <span className="line"><em>build</em> with<span className="acc">.</span></span>
          </h1>

          <div className="hero-bottom">
            <p className="hero-lead">
              Empat tahun. Dua belas laboratorium. Ratusan industri mitra — TRE menyiapkan tenaga ahli di bidang pembangkitan, transmisi, distribusi, dan instalasi tenaga listrik.
            </p>
            <div className="hero-actions">
              <a href="#" className="btn btn-primary">Daftar program <span className="arrow"></span></a>
              <a href="#" className="btn btn-secondary">Lihat kurikulum</a>
            </div>
          </div>

          <div className="hero-meta-strip">
            <div className="cell"><span className="k">Akreditasi</span><span className="v">UNGGUL · LAM Teknik</span></div>
            <div className="cell"><span className="k">Gelar</span><span className="v">S.Tr.T</span></div>
            <div className="cell"><span className="k">Durasi</span><span className="v">4 thn / 8 sem / 144 SKS</span></div>
            <div className="cell"><span className="k">Lokasi</span><span className="v">Yogyakarta · ID</span></div>
          </div>
        </div>

        {/* Right oversized numeral */}
        <div className="hero-numeral">
          <div className="numeral-label">PROGRAM ID</div>
          <div className="numeral-big">04</div>
          <div className="numeral-sub">tre · sv · ugm</div>
        </div>
      </div>

      {/* Marquee */}
      <div className="hero-marquee">
        <div className="marquee-track">
          {Array.from({length: 4}).map((_, i) => (
            <span key={i}>
              <em>PEMBANGKITAN</em><i>·</i>
              <em>TRANSMISI</em><i>·</i>
              <em>DISTRIBUSI</em><i>·</i>
              <em>INSTALASI</em><i>·</i>
              <em>SMART GRID</em><i>·</i>
              <em>ENERGI TERBARUKAN</em><i>·</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Hero = Hero;
