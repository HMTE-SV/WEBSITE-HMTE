function News() {
  const sideNews = [
    {
      title: "Kolaborasi laboratorium TRE perkuat praktik sistem tenaga",
      desc: "Dosen dan mitra industri menyiapkan sesi praktik berbasis kasus jaringan distribusi.",
      time: "6 menit",
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=520&q=80",
    },
    {
      title: "Mahasiswa TRE ikuti bootcamp otomasi industri",
      desc: "Kegiatan intensif mengenalkan pemrograman kontrol, panel, dan keselamatan kerja.",
      time: "9 menit",
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=520&q=80",
    },
    {
      title: "Riset terapan energi terbarukan masuk tahap uji lapangan",
      desc: "Tim menguji rancangan monitoring sederhana untuk kebutuhan fasilitas pendidikan.",
      time: "12 menit",
      image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=520&q=80",
    },
  ];

  const trending = [
    {
      title: "Kunjungan industri membuka peta kompetensi lulusan TRE",
      desc: "Mahasiswa melihat langsung standar kerja, dokumentasi teknis, dan disiplin keselamatan di fasilitas industri.",
      time: "14 menit",
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=720&q=80",
    },
    {
      title: "Kelas proteksi sistem tenaga bahas studi kasus gangguan",
      desc: "Perkuliahan menekankan pembacaan data, pemilihan peralatan, dan keputusan teknis yang dapat dipertanggungjawabkan.",
      time: "17 menit",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=720&q=80",
    },
    {
      title: "Forum alumni TRE rangkai jalur magang dan proyek akhir",
      desc: "Alumni berbagi pola kerja lintas bidang agar mahasiswa lebih siap masuk ke proyek riil.",
      time: "19 menit",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=720&q=80",
    },
  ];

  return (
    <section className="tre-news" data-screen-label="Berita">
      <div className="news-shell">
        <div className="news-head">
          <div className="news-tag"><span>05</span><i></i><em>BERITA TRE</em></div>
          <h2 className="news-h2">Kabar akademik, industri, dan riset terapan.</h2>
          <a href="#" className="news-more">Lihat semua <span></span></a>
        </div>

        <div className="news-feature-grid">
          <a href="#" className="news-feature">
            <div className="news-feature-media">
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80"
                alt="Mahasiswa berdiskusi dalam kegiatan akademik berbasis teknologi"
              />
              <div className="news-feature-meta">
                <span className="news-chip">Akademik</span>
                <span className="news-time"><i></i>10 menit</span>
              </div>
            </div>
            <h3>Dosen Teknologi Rekayasa Elektro perkuat jejaring pendidikan berbasis industri.</h3>
          </a>

          <div className="news-side-list">
            {sideNews.map((item) => (
              <a href="#" className="news-side-item" key={item.title}>
                <img src={item.image} alt="" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="news-time"><i></i>{item.time}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="news-trending-head">
          <h3>Trending news</h3>
          <a href="#" className="news-more compact">Lihat semua <span></span></a>
        </div>

        <div className="news-card-grid">
          {trending.map((item) => (
            <a href="#" className="news-card" key={item.title}>
              <img src={item.image} alt="" />
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <span className="news-time"><i></i>{item.time}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

window.News = News;
