function CTA() {
  return (
    <section className="tre-cta" data-screen-label="CTA">
      <div className="cta-shell">
        <div className="cta-left">
          <div className="cta-tag"><span>06</span><i></i><em>PENDAFTARAN 2026</em></div>
          <h2 className="cta-h2">
            Pendaftaran<br/>
            <span className="muted">2026</span><br/>
            <em>dibuka<span className="acc">.</span></em>
          </h2>
        </div>
        <div className="cta-right">
          <p className="cta-p">
            Sarjana Terapan Teknologi Rekayasa Elektro menerima mahasiswa baru melalui jalur SNBP, SNBT, dan jalur mandiri Sekolah Vokasi UGM.
          </p>
          <div className="cta-deadline">
            <div className="dl-label">Pendaftaran ditutup</div>
            <div className="dl-date">31 / 07 / 2026</div>
          </div>
          <div className="cta-actions">
            <a href="#" className="btn btn-primary">Daftar sekarang <span className="arrow"></span></a>
            <a href="#" className="btn btn-secondary">Unduh brosur</a>
          </div>
        </div>
      </div>
    </section>
  );
}

window.CTA = CTA;
