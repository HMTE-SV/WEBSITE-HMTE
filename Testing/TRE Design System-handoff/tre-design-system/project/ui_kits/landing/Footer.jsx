function Footer() {
  return (
    <footer className="tre-footer">
      <div className="container">
        <div className="top">
          <div className="col">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 3, height: 28, background: "#E30613" }}></div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>TRE</div>
            </div>
            <p className="addr">
              Sarjana Terapan Teknologi Rekayasa Elektro<br/>
              Departemen Teknik Elektro dan Informatika<br/>
              Sekolah Vokasi · Universitas Gadjah Mada
            </p>
            <p className="addr" style={{ marginTop: 16 }}>
              Gedung Herman Yohannes<br/>
              Sekip Unit 1, Catur Tunggal<br/>
              Depok, Sleman, Yogyakarta 55281
            </p>
          </div>
          <div className="col">
            <h4>Program</h4>
            <a href="#">Kurikulum</a>
            <a href="#">Laboratorium</a>
            <a href="#">Praktik Industri</a>
            <a href="#">Akreditasi</a>
          </div>
          <div className="col">
            <h4>Akademik</h4>
            <a href="#">Pendaftaran</a>
            <a href="#">Beasiswa</a>
            <a href="#">Kalender Akademik</a>
            <a href="#">Berita</a>
          </div>
          <div className="col">
            <h4>Kontak</h4>
            <a href="#">listrik.sv@ugm.ac.id</a>
            <a href="#">+62 274 582598</a>
            <a href="#">listrik.sv.ugm.ac.id</a>
            <a href="#">tre.sv.ugm.ac.id</a>
          </div>
        </div>
        <div className="bottom">
          <span>© 2026 SARJANA TERAPAN TEKNOLOGI REKAYASA ELEKTRO · UNIVERSITAS GADJAH MADA</span>
          <span>AKREDITASI UNGGUL · 21.04.2026 — 20.04.2031</span>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
