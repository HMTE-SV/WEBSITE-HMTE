import type { ArticleCategoryKey, ArticleGroup, ArticleTab } from '@/types/content'

export const articleTabs = [
  {
    "key": "berita-utama",
    "label": "Berita Utama"
  },
  {
    "key": "prestasi",
    "label": "Prestasi Mahasiswa"
  },
  {
    "key": "alumni",
    "label": "Kabar Alumni"
  },
  {
    "key": "magang",
    "label": "Info Magang"
  },
  {
    "key": "proyek-akhir",
    "label": "Proyek Akhir"
  },
  {
    "key": "pendidikan",
    "label": "Pendidikan"
  },
  {
    "key": "penelitian",
    "label": "Penelitian"
  },
  {
    "key": "pengabdian",
    "label": "Pengabdian"
  }
] satisfies ArticleTab[]

export const articleCategories = {
  "berita-utama": {
    "featured": {
      "image": "assets/ugm_socialization.png",
      "publisher": "DTEDI SV UGM",
      "publisherIcon": "D",
      "timeAgo": "Mei 25, 2026",
      "title": "Sosialisasi Praktik Industri Mahasiswa Teknologi Rekayasa Elektro (TRE) UGM",
      "excerpt": "Program Studi Teknologi Rekayasa Elektro (TRE) Departemen Teknik Elektro dan Informatika (DTEDI) Sekolah Vokasi Universitas Gadjah Mada menyelenggarakan kegiatan sosialisasi Praktik Industri (PI) bagi mahasiswa pada Sabtu, 7 Maret 2026 untuk membekali mahasiswa sebelum terjun ke dunia industri.",
      "category": "Akademik",
      "readTime": "5 min read"
    },
    "latest": [
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 25, 2026",
        "title": "Jelang Pengumuman SNBT, Calon Mahasiswa UGM Perlu Siapkan Dokumen Registrasi Ini",
        "excerpt": "Calon mahasiswa UGM dihimbau mempersiapkan berkas registrasi menyusul pengumuman jalur SNBT 2026.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 22, 2026",
        "title": "Sekolah Vokasi UGM dan PT ETI Fire Systems Perkuat Kolaborasi Pendidikan Vokasi dan Industri",
        "excerpt": "Kolaborasi strategis vokasi-industri dalam perhelatan Mechanical Fair 2026 guna mempersiapkan SDM siap kerja.",
        "category": "SV UGM",
        "readTime": "6 min read"
      },
      {
        "image": "assets/smart_grid_dashboard.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 19, 2026",
        "title": "Mahasiswa DTEDI SV UGM Ikuti Semicon Southeast Asia Zoomers Bootcamp 2026",
        "excerpt": "Partisipasi aktif mahasiswa dalam pelatihan mikroelektronika tingkat regional di Kuala Lumpur, Malaysia.",
        "category": "DTEDI",
        "readTime": "8 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "Mei 25, 2026",
        "title": "UGM dan Dewan Jamu DIY Kampanyekan Budaya Minum Jamu untuk Kesehatan",
        "excerpt": "Kampanye bersama pelestarian warisan budaya minum jamu tradisional guna mendukung gaya hidup sehat.",
        "category": "UGM",
        "readTime": "5 min read"
      }
    ]
  },
  "prestasi": {
    "featured": {
      "image": "assets/robotics_prestige.png",
      "publisher": "SV UGM",
      "publisherIcon": "S",
      "timeAgo": "Mei 19, 2026",
      "title": "Tim Robotika TRE SV UGM Sukses Menyabet Juara di Ajang Nasional KRI 2026",
      "excerpt": "Tim mahasiswa Teknologi Rekayasa Elektro SV UGM berhasil membawa pulang medali emas setelah mengalahkan puluhan pesaing ketat dari berbagai perguruan tinggi nasional.",
      "category": "Prestasi",
      "readTime": "6 min read"
    },
    "latest": [
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 24, 2026",
        "title": "Mahasiswa UGM Borong Medali Emas di International Mathematics Competition 2026",
        "excerpt": "Delegasi matematika UGM mendominasi podium juara pada ajang bergengsi tingkat dunia.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/smart_grid_dashboard.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 19, 2026",
        "title": "Sekolah Vokasi UGM Apresiasi Prestasi Dosen, Departemen, dan Program Studi Unggul",
        "excerpt": "Penghargaan tahunan diberikan bagi insan akademik berprestasi yang mengharumkan nama almamater.",
        "category": "SV UGM",
        "readTime": "7 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 10, 2026",
        "title": "Mahasiswa DTEDI Juara Hackathon Nasional dengan Solusi Smart Grid IoT",
        "excerpt": "Inovasi manajemen daya listrik terdistribusi berbasis internet-of-things raih penghargaan utama.",
        "category": "DTEDI",
        "readTime": "5 min read"
      },
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "Mei 05, 2026",
        "title": "Delegasi HMTE Sabet Best Paper di Konferensi Teknik Elektro Nasional",
        "excerpt": "Riset mahasiswa mengenai efisiensi penyimpanan baterai panel surya dinilai terbaik oleh tim reviewer.",
        "category": "HMTE",
        "readTime": "5 min read"
      }
    ]
  },
  "alumni": {
    "featured": {
      "image": "assets/semiconductor_career.png",
      "publisher": "DTEDI SV UGM",
      "publisherIcon": "D",
      "timeAgo": "Mei 21, 2026",
      "title": "Alumni TRE SV UGM Berbagi Pengalaman Kerja Industri Semikonduktor Global",
      "excerpt": "Dalam sesi bincang hangat alumni, lulusan TRE UGM yang kini berkarier sebagai IC Design Engineer di Jerman membagikan wawasan mengenai tren industri sirkuit terpadu global.",
      "category": "Alumni",
      "readTime": "7 min read"
    },
    "latest": [
      {
        "image": "assets/smart_grid_dashboard.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 25, 2026",
        "title": "Pertemuan Pengurus KAGAMA: Sinergi Alumni Dukung Pembangunan Nasional",
        "excerpt": "Keluarga Alumni Universitas Gadjah Mada merumuskan aksi nyata pemberdayaan ekonomi masyarakat.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 19, 2026",
        "title": "Keluarga Alumni Vokasi (KAVOGAMA) Gelar Pembekalan Karir Lulusan Baru",
        "excerpt": "Seminar eksklusif penulisan CV resume ATS dan simulasi wawancara kerja profesional untuk fresh graduate.",
        "category": "SV UGM",
        "readTime": "6 min read"
      },
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 08, 2026",
        "title": "Alumni DTEDI Berbagi Pengalaman Kerja di BUMN Sektor Transisi Energi",
        "excerpt": "Sharing session alumni yang bekerja di PLN dan Pertamina Geothermal tentang integrasi energi terbarukan.",
        "category": "DTEDI",
        "readTime": "5 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "April 28, 2026",
        "title": "Bincang Santai Alumni TRE Lintas Generasi Garapan Divisi Eksternal HMTE",
        "excerpt": "Membangun relasi erat antar alumni dan mahasiswa aktif guna bertukar info lowongan pekerjaan.",
        "category": "HMTE",
        "readTime": "5 min read"
      }
    ]
  },
  "magang": {
    "featured": {
      "image": "assets/smart_grid_dashboard.png",
      "publisher": "SV UGM",
      "publisherIcon": "S",
      "timeAgo": "Mei 20, 2026",
      "title": "Program Magang Bersertifikat MSIB Batch 7 di Bidang Energi Terbarukan",
      "excerpt": "Kesempatan bagi mahasiswa tingkat akhir Teknologi Rekayasa Elektro untuk melaksanakan magang industri terstruktur selama satu semester penuh di mitra industri strategis nasional.",
      "category": "Magang",
      "readTime": "5 min read"
    },
    "latest": [
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 24, 2026",
        "title": "UGM Career Center Rilis Daftar Perusahaan Pembuka Magang Semester Genap",
        "excerpt": "Lebih dari 40 mitra industri membuka lowongan magang resmi untuk mahasiswa elektro dan informatika.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 19, 2026",
        "title": "Bekal Menembus Dunia Kerja: Sekolah Vokasi Gelar Kuliah Umum Magang Industri Pako Group",
        "excerpt": "Pembekalan intensif etika kerja dan kedisiplinan industri sebelum memulai masa magang terpadu.",
        "category": "SV UGM",
        "readTime": "5 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 12, 2026",
        "title": "Pendaftaran Magang Laboratorium Riset DTEDI untuk Proyek Smart City UGM",
        "excerpt": "Kesempatan riset terapan berbayar bagi mahasiswa elektro yang ingin mengasah skill sirkuit hardware.",
        "category": "DTEDI",
        "readTime": "6 min read"
      },
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "Mei 02, 2026",
        "title": "HMTE Bagikan Booklet Panduan Magang Industri TRE Terlengkap 2026",
        "excerpt": "Buku panduan digital berisi daftar kontak HRD industri mitra dan kiat-kiat lolos seleksi berkas magang.",
        "category": "HMTE",
        "readTime": "3 min read"
      }
    ]
  },
  "proyek-akhir": {
    "featured": {
      "image": "assets/smart_grid_dashboard.png",
      "publisher": "DTEDI SV UGM",
      "publisherIcon": "D",
      "timeAgo": "Mei 18, 2026",
      "title": "Inovasi Capstone Project TRE: Rancang Bangun Monitoring Smart Grid Terpadu",
      "excerpt": "Karya kolaboratif proyek akhir mahasiswa TRE merancang sistem monitoring distribusi listrik terbarukan berbasis panel surya yang siap diimplementasikan skala prototipe industri.",
      "category": "Proyek Akhir",
      "readTime": "5 min read"
    },
    "latest": [
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 22, 2026",
        "title": "Pameran Tugas Akhir Fakultas Teknik UGM Tampilkan Puluhan Teknologi Paten",
        "excerpt": "Showcase inovasi tugas akhir mahasiswa yang siap diproduksi massal oleh industri dalam negeri.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 19, 2026",
        "title": "SV Expo 2026 Tampilkan Purwarupa Inovasi Terapan Terbaik Mahasiswa Vokasi",
        "excerpt": "Pameran tahunan memamerkan prototipe pembangkit listrik mini portable dan sensor IoT industri.",
        "category": "SV UGM",
        "readTime": "6 min read"
      },
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 06, 2026",
        "title": "Sidang Proyek Akhir DTEDI SV UGM Periode Mei 2026 Digelar Hibrida",
        "excerpt": "Sebanyak 30 mahasiswa TRE menjalani pengujian materi proyek akhir oleh tim dosen dan penguji eksternal.",
        "category": "DTEDI",
        "readTime": "4 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "April 30, 2026",
        "title": "HMTE Rilis Repositori Digital Judul Proyek Akhir Mahasiswa TRE Terdahulu",
        "excerpt": "Akses mudah ke arsip abstrak dan metode penelitian proyek akhir alumni untuk referensi mahasiswa aktif.",
        "category": "HMTE",
        "readTime": "3 min read"
      }
    ]
  },
  "pendidikan": {
    "featured": {
      "image": "assets/ugm_socialization.png",
      "publisher": "DTEDI SV UGM",
      "publisherIcon": "D",
      "timeAgo": "Mei 15, 2026",
      "title": "Implementasi Kurikulum Baru TRE Berorientasi Project-Based Learning (PBL)",
      "excerpt": "Prodi TRE SV UGM resmi memperbarui kurikulum perkuliahan dengan memfokuskan porsi praktik hingga 60 persen berbasis pengerjaan kasus nyata dari dunia industri.",
      "category": "Pendidikan",
      "readTime": "6 min read"
    },
    "latest": [
      {
        "image": "assets/smart_grid_dashboard.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 21, 2026",
        "title": "UGM Kukuhkan Peringkat Kampus Terbaik Nasional Versi Pemeringkatan Global QS World",
        "excerpt": "Metrik reputasi akademis dan tingkat keterserapan kerja alumni UGM di kancah dunia raih nilai sangat tinggi.",
        "category": "UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 18, 2026",
        "title": "Sekolah Vokasi Resmikan Fasilitas Lab Mikroelektronika dan IoT Baru",
        "excerpt": "Penyediaan sarana alat ukur modern berkat kerja sama pendanaan hibah kemitraan vokasi.",
        "category": "SV UGM",
        "readTime": "5 min read"
      },
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 08, 2026",
        "title": "DTEDI Selenggarakan Pelatihan Dosen Mengenai Sistem Embedded Berbasis AI",
        "excerpt": "Transfer wawasan teknologi mikrokontroler canggih untuk memperkaya kurikulum pembelajaran di kelas.",
        "category": "DTEDI",
        "readTime": "6 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "April 20, 2026",
        "title": "HMTE Academy Gelar Kelas Tambahan Pemrograman Microcontroller Arduino & STM32",
        "excerpt": "Praktikum sebaya yang dimentori oleh asisten laboratorium untuk menopang pemahaman kuliah sirkuit digital.",
        "category": "HMTE",
        "readTime": "5 min read"
      }
    ]
  },
  "penelitian": {
    "featured": {
      "image": "assets/semiconductor_career.png",
      "publisher": "DTEDI SV UGM",
      "publisherIcon": "D",
      "timeAgo": "Mei 12, 2026",
      "title": "Kolaborasi Riset Dosen TRE Kembangkan Sensor Deteksi Suhu Trafo Berbasis AI",
      "excerpt": "Penelitian paten ini menghasilkan perangkat monitoring trafo daya cerdas guna menghindari kegagalan sistem kelistrikan pada gardu induk distribusi.",
      "category": "Penelitian",
      "readTime": "8 min read"
    },
    "latest": [
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 20, 2026",
        "title": "UGM Raih Hibah Riset Rp 50 Miliar untuk Riset Transisi Energi Hijau",
        "excerpt": "Alokasi dana difokuskan untuk membiayai penelitian sel surya material perovskite dan turbin angin terdistribusi.",
        "category": "UGM",
        "readTime": "5 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 15, 2026",
        "title": "Sekolah Vokasi UGM Bangun Pusat Riset Terapan (VRC) di Kulon Progo",
        "excerpt": "Pusat integrasi riset rekayasa industri vokasi untuk mempermudah inkubasi purwarupa karya mahasiswa.",
        "category": "SV UGM",
        "readTime": "6 min read"
      },
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 06, 2026",
        "title": "Publikasi Riset DTEDI: Optimasi Algoritma Kontrol Smart Grid Berbasis Machine Learning",
        "excerpt": "Karya ilmiah kolaborasi berhasil menembus publikasi jurnal internasional bereputasi tinggi kuartil Q1.",
        "category": "DTEDI",
        "readTime": "7 min read"
      },
      {
        "image": "assets/solar_village.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "April 15, 2026",
        "title": "HMTE Research Forum: Mengupas Peluang Pendanaan Program Kreativitas Mahasiswa (PKM)",
        "excerpt": "Sharing session bersama dosen pembimbing trik lolos proposal riset pendanaan nasional.",
        "category": "HMTE",
        "readTime": "4 min read"
      }
    ]
  },
  "pengabdian": {
    "featured": {
      "image": "assets/solar_village.png",
      "publisher": "HMTE",
      "publisherIcon": "H",
      "timeAgo": "Mei 10, 2026",
      "title": "HMTE Mengabdi Sukses Pasang 15 Unit Penerangan Jalan Umum Tenaga Surya",
      "excerpt": "Program pengabdian masyarakat mahasiswa TRE memasang PJU tenaga surya pintar di daerah terisolir Desa Kulon Progo untuk membantu kelancaran ekonomi warga desa.",
      "category": "Pengabdian",
      "readTime": "6 min read"
    },
    "latest": [
      {
        "image": "assets/ugm_socialization.png",
        "publisher": "UGM",
        "publisherIcon": "U",
        "timeAgo": "Mei 24, 2026",
        "title": "UGM Terjunkan 3.000 Mahasiswa KKN-PPM Periode II Menuju 30 Provinsi",
        "excerpt": "Fokus program KKN kali ini menyasar digitalisasi kelurahan dan pemasangan sistem penyaringan air mandiri.",
        "category": "UGM",
        "readTime": "5 min read"
      },
      {
        "image": "assets/robotics_prestige.png",
        "publisher": "SV UGM",
        "publisherIcon": "S",
        "timeAgo": "Mei 18, 2026",
        "title": "Dosen Vokasi Gelar Pelatihan Teknik Keamanan Kelistrikan Rumah Tangga",
        "excerpt": "Pemberdayaan ibu-ibu PKK dan warga kelurahan untuk mengantisipasi potensi bahaya arus pendek.",
        "category": "SV UGM",
        "readTime": "4 min read"
      },
      {
        "image": "assets/semiconductor_career.png",
        "publisher": "DTEDI SV UGM",
        "publisherIcon": "D",
        "timeAgo": "Mei 06, 2026",
        "title": "DTEDI SV UGM Selenggarakan Pelatihan Digitalisasi Web Karang Taruna Desa Wisata",
        "excerpt": "Pengajaran pengolahan blog wordpress dan SEO lokal bagi pemuda desa binaan di kawasan lereng Merapi.",
        "category": "DTEDI",
        "readTime": "6 min read"
      },
      {
        "image": "assets/smart_grid_dashboard.png",
        "publisher": "HMTE",
        "publisherIcon": "H",
        "timeAgo": "April 10, 2026",
        "title": "HMTE Gelar Donasi Buku & Peralatan Belajar Kreatif di Sekolah Dasar Tertinggal",
        "excerpt": "Penyaluran 500 buku fiksi edukasi dan kit sains eksperimen sederhana listrik statis untuk siswa SD.",
        "category": "HMTE",
        "readTime": "4 min read"
      }
    ]
  }
} satisfies Record<ArticleCategoryKey, ArticleGroup>
