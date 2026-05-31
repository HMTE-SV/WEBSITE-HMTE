export function Gallery() {
  return (
    <section className="tre-gallery" id="galeri">
          <div className="gallery-shell">
            <header className="gallery-head fade-up">
              <div className="gallery-tag">
                <span className="g-num">02</span>
                <span className="g-line"></span>
                <span>NAVIGASI HALAMAN</span>
              </div>
              <h2 className="gallery-h2">
                Navigasi cepat untuk halaman yang perlu ada di website HMTE<span className="acc">.</span>
              </h2>
            </header>
            <div className="gallery-hub fade-up">
              <div className="hub-control">
                <span className="hub-kicker">Navigasi cepat</span>
                <h3>Peta halaman HMTE.</h3>
                <div className="hub-console">
                  <div className="hub-stat">
                    <strong>10</strong>
                    <span>Halaman arah</span>
                  </div>
                  <div className="hub-stat">
                    <strong>03</strong>
                    <span>Status data</span>
                  </div>
                </div>
              </div>
              <div className="gallery-grid">
                <a className="gallery-card" href="#kontak">
                  <span className="card-kicker">Tentang</span>
                  <div>
                    <span className="status-tag confirmed">Terkonfirmasi</span>
                    <h3>Identitas organisasi</h3>
                    <p>Profil HMTE TRE SV UGM dan relasi kelembagaan dengan TRE, DTEDI, SV UGM, dan UGM.</p>
                    <span className="card-link">Buka tentang →</span>
                  </div>
                </a>
                <a className="gallery-card" href="#pillars">
                  <span className="card-kicker">Kepengurusan</span>
                  <div>
                    <span className="status-tag indicated">Indikasi publik</span>
                    <h3>Pengurus &amp; divisi</h3>
                    <p>Ruang untuk struktur pengurus, bidang/divisi, dan foto resmi yang masih perlu dikonfirmasi.</p>
                    <span className="card-link">Lihat struktur →</span>
                  </div>
                </a>
                <a className="gallery-card" href="#kurikulum">
                  <span className="card-kicker">Program kerja</span>
                  <div>
                    <span className="status-tag pending">Perlu konfirmasi</span>
                    <h3>Agenda &amp; proker</h3>
                    <p>Agenda, kegiatan, program kerja, dan arsip kemahasiswaan yang nanti diganti dengan data resmi.</p>
                    <span className="card-link">Buka ledger →</span>
                  </div>
                </a>
                <a className="gallery-card" href="#mitra">
                  <span className="card-kicker">Publikasi</span>
                  <div>
                    <span className="status-tag indicated">Indikasi publik</span>
                    <h3>Berita, galeri, alumni</h3>
                    <p>Berita, prestasi, galeri, alumni, kontak, dan kolaborasi disiapkan sebagai halaman mudah dipindai.</p>
                    <span className="card-link">Lihat publikasi →</span>
                  </div>
                </a>
              </div>
            </div>
    
          </div>
        </section>
  )
}
