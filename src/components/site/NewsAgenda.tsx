export function NewsAgenda() {
  return (
    <section className="tre-news-agenda" id="stats">
          <div className="news-agenda-shell">
            <header className="news-agenda-head">
              <div className="news-agenda-kicker fade-up">
                <span className="s-num">01</span>
                <span className="s-line"></span>
                <span>Berita &amp; Agenda</span>
              </div>
              <div className="fade-up">
                <h2 className="news-agenda-title">Kabar kegiatan dan agenda HMTE<span className="acc">.</span></h2>
                <p className="news-agenda-lead">Ikuti perkembangan informasi akademik, prestasi mahasiswa, lowongan magang, proyek akhir, serta pengabdian masyarakat di lingkungan Departemen Teknik Elektro dan Informatika (DTEDI) Sekolah Vokasi UGM.</p>
              </div>
            </header>
    
            
            <div className="news-tabs-container fade-up">
              <div className="news-tabs-nav" role="tablist" aria-label="Kategori Berita">
                <button className="news-tab-btn active" role="tab" aria-selected="true" data-tab="berita-utama">Berita Utama</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="prestasi">Prestasi Mahasiswa</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="alumni">Kabar Alumni</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="magang">Info Magang</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="proyek-akhir">Proyek Akhir</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="pendidikan">Pendidikan</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="penelitian">Penelitian</button>
                <button className="news-tab-btn" role="tab" aria-selected="false" data-tab="pengabdian">Pengabdian</button>
              </div>
            </div>
    
            
            <div className="news-featured-container fade-up" id="featuredArticleContainer">
              
            </div>
    
            
            <div className="news-latest-section fade-up">
              <div className="news-latest-header">
                <h3 className="news-latest-title">Berita Terkini</h3>
                <a href="#mitra" className="news-see-all">Lihat Semua <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a>
              </div>
              <div className="news-card-grid" id="latestNewsGrid">
                
              </div>
            </div>
    
          </div>
        </section>
  )
}
