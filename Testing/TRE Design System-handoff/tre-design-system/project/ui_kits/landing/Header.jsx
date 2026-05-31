function Header({ active = "Program" }) {
  const items = ["Program", "Kurikulum", "Industri Mitra", "Berita", "Kontak"];
  return (
    <header className="tre-header">
      <div className="container">
        <div className="brand">
          <div className="bar"></div>
          <div>
            <div className="wordmark">TRE</div>
          </div>
          <div className="sub">SV·UGM</div>
        </div>
        <nav>
          {items.map((it) => (
            <a key={it} className={it === active ? "active" : ""} href="#">{it}</a>
          ))}
        </nav>
        <a href="#" className="cta">Daftar →</a>
      </div>
    </header>
  );
}

window.Header = Header;
