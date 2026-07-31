import type { DivisionCode, Program } from '@/types/content'

export const programsByDivision = {
  PH: [
    {
      name: 'Musta dan Sertijab',
      desc: 'Agenda Musta dan Sertijab yang tercantum dalam kalender kerja Pengurus Harian.',
      status: 'Terjadwal',
      date: 'Februari',
      months: [2],
    },
    {
      name: 'Raker 26/27',
      desc: 'Rapat kerja HMTE Periode 2026/2027 yang tercantum dalam kalender kerja Pengurus Harian.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
      // Contoh program yang tanggalnya sudah ditetapkan. Sisanya sengaja
      // dibiarkan tanpa tanggal: Buku Panduan memang hanya menyebut bulan, dan
      // mengarang tanggal justru mengulang kesalahan yang sedang diperbaiki.
      startDate: '2026-04-12',
      endDate: '2026-04-14',
    },
    {
      name: 'SOTM',
      desc: 'Agenda SOTM yang dijadwalkan empat kali dalam kalender kerja Pengurus Harian.',
      status: 'Berkala',
      date: 'Maret, Juni, September, dan Desember',
      months: [3, 6, 9, 12],
    },
    {
      name: 'Evaluasi Bulanan',
      desc: 'Evaluasi berkala Pengurus Harian yang tercantum setiap bulan sepanjang periode.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
  PSDM: [
    {
      name: 'TORSI',
      desc: 'Training Organization and Study for Engineering: pembekalan organisasi, kepemimpinan, administrasi, tata kelola kegiatan, proposal, dan LPJ bagi pengurus HMTE.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
      featured: true,
      summary:
        'TORSI (Training Organization and Study for Engineering) mempersiapkan seluruh pengurus dengan pemahaman dasar mengenai organisasi, administrasi, kepemimpinan, dan tata kelola kegiatan selama satu periode.',
      objectives: [
        'Kesiapan pengurus menjalankan tanggung jawab organisasi',
        'Pengembangan hard skill dan soft skill',
        'Kebersamaan dan kekeluargaan antarpengurus',
      ],
      timeline: [
        {
          label: 'Pelatihan Dasar Organisasi',
          when: 'April',
          detail:
            'Pembekalan dasar manajemen organisasi, kepemimpinan, koordinasi, dan tanggung jawab pengurus.',
        },
        {
          label: 'Diskusi Terbuka',
          when: 'April',
          detail:
            'Berbagi pengalaman dan transfer pengetahuan antara pengurus periode sebelumnya dengan pengurus baru.',
        },
        {
          label: 'Pengenalan Dokumen Organisasi',
          when: 'April',
          detail:
            'Pengenalan administrasi, proposal, laporan pertanggungjawaban, pengarsipan, dan dokumen resmi HMTE.',
        },
        {
          label: 'Fun & Games',
          when: 'April',
          detail:
            'Kegiatan kebersamaan untuk mempererat hubungan dan membangun komunikasi internal pengurus.',
        },
      ],
    },
    {
      name: 'IGNITE (Initial Gathering of New Electro)',
      desc: 'Penyambutan dan pengenalan lingkungan akademik, budaya kemahasiswaan, dan HMTE kepada mahasiswa baru TRE.',
      status: 'Terjadwal',
      date: 'Agustus',
      months: [8],
    },
    {
      name: 'Open House',
      desc: 'Pengenalan profil, struktur, fungsi departemen, program kerja, dan kegiatan HMTE kepada mahasiswa baru.',
      status: 'Terjadwal',
      date: 'Agustus',
      months: [8],
    },
    {
      name: 'Open Recruitment',
      desc: 'Rangkaian sosialisasi, pendaftaran, seleksi, dan penetapan anggota baru HMTE.',
      status: 'Terjadwal',
      date: 'Februari-Maret',
      months: [2, 3],
    },
    {
      name: 'Farewell Party',
      desc: 'Kegiatan apresiasi bagi pengurus yang menyelesaikan masa bakti sekaligus penanda estafet kepengurusan.',
      status: 'Terjadwal',
      date: 'Desember',
      months: [12],
    },
    {
      name: 'Formasi',
      desc: 'Pembinaan, monitoring, dan pendampingan anggota HMTE yang dilaksanakan secara berkelanjutan selama satu periode.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
  PHAL: [
    {
      name: 'Kunjungan Industri',
      desc: 'Kunjungan untuk mengamati penerapan ilmu dan teknologi, sistem kerja, serta budaya kerja di industri yang relevan dengan TRE.',
      status: 'Terjadwal',
      date: 'Agustus',
      months: [8],
    },
    {
      name: 'Studi Banding',
      desc: 'Pertukaran informasi, pengalaman, dan praktik pengelolaan organisasi bersama organisasi mahasiswa atau institusi lain.',
      status: 'Terjadwal',
      date: 'Juli-Agustus',
      months: [7, 8],
    },
    {
      name: 'Reuni Alumni',
      desc: 'Wadah silaturahmi, penguatan jejaring, dan berbagi pengalaman antara alumni, mahasiswa, program studi, dan HMTE.',
      status: 'Terjadwal',
      date: 'Juli-Agustus',
      months: [7, 8],
    },
    {
      name: 'PHAL Camp',
      desc: 'Kegiatan kebersamaan untuk mempererat hubungan, solidaritas, dan sinergi antaranggota HMTE.',
      status: 'Terjadwal',
      date: 'Agustus',
      months: [8],
    },
  ],
  MINKAT: [
    {
      name: 'Elektro Cup',
      desc: 'Wadah pengembangan minat, bakat, dan sportivitas melalui perlombaan olahraga, seni, dan e-sport bagi mahasiswa TRE.',
      status: 'Terjadwal',
      date: 'September',
      months: [9],
      featured: true,
      summary:
        'Elektro Cup mempertemukan seluruh angkatan aktif TRE melalui kegiatan olahraga, seni, dan kompetisi lain yang tetap menjunjung kebersamaan.',
      objectives: [
        'Penyaluran minat dan bakat mahasiswa',
        'Sportivitas dan solidaritas',
        'Kekeluargaan lintas angkatan',
      ],
      timeline: [
        {
          label: 'Pelaksanaan Program',
          when: 'September',
          detail:
            'Kegiatan olahraga, seni, atau kompetisi lain sebagai ruang penyaluran potensi nonakademik mahasiswa TRE.',
        },
      ],
    },
    {
      name: 'Kontingen TGES',
      desc: 'Penjaringan, persiapan, dan pendampingan mahasiswa yang mewakili TRE dalam berbagai cabang perlombaan TGES.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
    },
    {
      name: 'Excel Night',
      desc: 'Kegiatan apresiasi atas prestasi, dedikasi, dan kontribusi mahasiswa bagi HMTE maupun Program Studi TRE.',
      status: 'Terjadwal',
      date: 'Desember',
      months: [12],
    },
  ],
  KOMINFO: [
    {
      name: 'Rilis Kabinet & Grand Design',
      desc: 'Publikasi resmi nama kabinet, logo dan filosofinya, struktur kepengurusan, serta arah gerak HMTE.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
    },
    {
      name: 'Foto Kabinet',
      desc: 'Dokumentasi resmi seluruh pengurus untuk publikasi, pengenalan pengurus, administrasi, dan media informasi HMTE.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
    },
    {
      name: 'Life Outside HMTE',
      desc: 'Publikasi profil dan pengalaman mahasiswa TRE yang berprestasi atau berkontribusi di luar HMTE.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Form Order',
      desc: 'Sistem pengajuan kebutuhan desain, publikasi, dokumentasi, dan media informasi dari seluruh departemen HMTE.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Live Report dan Dokumentasi',
      desc: 'Publikasi aktual, pengambilan foto dan video, serta pengarsipan dokumentasi pada setiap kegiatan resmi HMTE.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Hari Besar',
      desc: 'Publikasi konten edukatif dan informatif untuk memperingati hari besar nasional maupun internasional.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
  IPTEK: [
    {
      name: 'HMTE Mengajar',
      desc: 'Pengenalan dunia Teknik Elektro kepada siswa SMA/SMK melalui materi, demonstrasi teknologi, dan berbagi pengalaman perkuliahan.',
      status: 'Terjadwal',
      date: 'Oktober',
      months: [10],
      featured: true,
      summary:
        'HMTE Mengajar mengenalkan ilmu dasar keelektroan dan teknologi kepada masyarakat, khususnya pelajar, sekaligus menjadi ruang pengembangan komunikasi, kepemimpinan, dan kepedulian sosial mahasiswa HMTE.',
      objectives: [
        'Transfer wawasan teknologi',
        'Pengenalan citra positif Program Studi TRE',
        'Pendidikan dan pengabdian masyarakat',
      ],
      timeline: [
        {
          label: 'Pelaksanaan Program',
          when: 'Oktober',
          detail:
            'Kegiatan edukatif berupa penyampaian materi, demonstrasi sederhana, diskusi, atau pelatihan dasar ilmu pengetahuan dan teknologi.',
        },
      ],
    },
    {
      name: 'Mading IPTEK',
      desc: 'Media publikasi edukatif mengenai ilmu pengetahuan, teknologi, inovasi, dan perkembangan bidang Teknik Elektro.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Website HMTE',
      desc: 'Pengelolaan dan pengembangan pusat informasi digital resmi yang memuat profil, program kerja, berita, dan dokumentasi HMTE.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Kepelatihan IPTEK',
      desc: 'Pelatihan teknologi, perangkat lunak, dan keterampilan teknis yang mendukung kegiatan akademik serta dunia profesional.',
      status: 'Terjadwal',
      date: 'September-November',
      months: [9, 10, 11],
    },
    {
      name: 'IPTEK Mengajar',
      desc: 'Kelas belajar, diskusi, pembahasan materi, dan pelatihan sebagai wadah berbagi pengetahuan serta pendampingan akademik.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Bank Soal',
      desc: 'Penghimpunan dan pengelolaan soal ujian, kuis, latihan, serta referensi pembahasan sebagai bahan belajar mahasiswa TRE.',
      status: 'Berkala',
      date: 'April, Juni, Oktober, dan Desember',
      months: [4, 6, 10, 12],
    },
  ],
  KEWIRUS: [
    {
      name: 'Korsa Himpunan Mahasiswa Teknik Elektro (HMTE)',
      desc: 'Perencanaan, pengadaan, dan pendistribusian korsa sebagai atribut resmi serta identitas anggota HMTE.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
    },
    {
      name: 'Awul-Awul',
      desc: 'Pengelolaan dan penjualan pakaian layak pakai untuk pengembangan kewirausahaan, keberlanjutan, dan penggalangan dana organisasi.',
      status: 'Terjadwal',
      date: 'September',
      months: [9],
    },
    {
      name: 'Merchandise',
      desc: 'Perancangan, produksi, dan penjualan produk yang mencerminkan identitas HMTE sesuai kebutuhan.',
      status: 'Terjadwal',
      date: 'Agustus',
      months: [8],
    },
    {
      name: 'Danusan',
      desc: 'Penjualan produk untuk melatih pengelolaan usaha dan mendukung kemandirian finansial HMTE.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  ],
  KASTRAD: [
    {
      name: 'Kastrad Berbagi',
      desc: 'Penyebaran informasi akademik, pengalaman mahasiswa, beasiswa, kompetisi, dan peluang pengembangan diri.',
      status: 'Berkala',
      date: 'Januari-Desember',
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    {
      name: 'Heregistrasi Mahasiswa Baru',
      desc: 'Informasi, pendampingan, dan panduan tahapan administrasi awal bagi mahasiswa baru Program Studi TRE.',
      status: 'Terjadwal',
      date: 'April, Juni, dan Juli',
      months: [4, 6, 7],
    },
    {
      name: 'Riset Prodi',
      desc: 'Penghimpunan dan analisis aspirasi, saran, serta evaluasi mahasiswa untuk disampaikan kepada program studi.',
      status: 'Terjadwal',
      date: 'April',
      months: [4],
    },
    {
      name: 'Academic Series',
      desc: 'Sosialisasi, seminar, webinar, atau sesi berbagi untuk pembekalan dan pengembangan wawasan akademik mahasiswa TRE.',
      status: 'Terjadwal',
      date: 'Maret-April dan Agustus',
      months: [3, 4, 8],
    },
  ],
} satisfies Record<DivisionCode, Program[]>
