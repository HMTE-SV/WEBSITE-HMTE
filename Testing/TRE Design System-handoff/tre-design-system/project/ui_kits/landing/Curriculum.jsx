function Curriculum() {
  const rows = [
    { code: "EE-1101", name: "Matematika Teknik",                sks: "3", t: "T", sem: "1" },
    { code: "EE-1102", name: "Rangkaian Listrik Dasar",          sks: "4", t: "T+P", sem: "1" },
    { code: "EE-2103", name: "Mesin-Mesin Listrik",              sks: "4", t: "T+P", sem: "2" },
    { code: "EE-3104", name: "Sistem Tenaga Listrik",            sks: "3", t: "T+P", sem: "3" },
    { code: "EE-3201", name: "Sistem Proteksi & Kontrol",        sks: "3", t: "T+P", sem: "3" },
    { code: "EE-4201", name: "Praktik Instalasi Listrik",        sks: "4", t: "P",   sem: "4" },
    { code: "EE-4301", name: "Energi Terbarukan & Smart Grid",   sks: "3", t: "T+P", sem: "5" },
    { code: "EE-7000", name: "Praktik Industri (PI)",            sks: "8", t: "P",   sem: "7", highlight: true },
  ];
  return (
    <section className="tre-section dark tre-curriculum" data-screen-label="Curriculum">
      <div className="curr-shell">

        <header className="curr-head">
          <div className="curr-tag">
            <span>03</span><i></i><em>KURIKULUM</em>
          </div>
          <h2 className="curr-h2">
            <span className="big">144</span><span className="big-sub">SKS</span>
          </h2>
          <p className="curr-lead">
            8 semester. Dari rangkaian dasar hingga praktik industri di PLN, Schneider, dan Indonesia Power. Setiap mata kuliah memuat komponen praktikum di laboratorium aktif.
          </p>
          <div className="curr-legend">
            <span><b>T</b> teori</span>
            <span><b>P</b> praktikum</span>
            <span><b>T+P</b> kombinasi</span>
          </div>
        </header>

        <div className="curr-list">
          <div className="curr-row curr-head-row">
            <div className="c-idx">#</div>
            <div className="c-code">KODE</div>
            <div className="c-name">MATA KULIAH</div>
            <div className="c-type">TIPE</div>
            <div className="c-sem">SEM</div>
            <div className="c-sks">SKS</div>
          </div>
          {rows.map((r, i) => (
            <div className={"curr-row" + (r.highlight ? " hl" : "")} key={r.code}>
              <div className="c-idx">{String(i+1).padStart(2, "0")}</div>
              <div className="c-code">{r.code}</div>
              <div className="c-name">{r.name}</div>
              <div className="c-type"><span className={"type-pill type-" + r.t.replace("+", "p")}>{r.t}</span></div>
              <div className="c-sem">{r.sem}</div>
              <div className="c-sks"><b>{r.sks}</b></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

window.Curriculum = Curriculum;
