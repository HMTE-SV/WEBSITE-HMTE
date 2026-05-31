import type { DivisionCode, Program } from '@/types/content'

export const programsByDivision = {
  "PH": [
    {
      "name": "Rapat Kerja Himpunan",
      "desc": "Penyusunan dan pengesahan seluruh program kerja pengurus HMTE periode 2026.",
      "status": "Selesai",
      "date": "Juni 2026"
    },
    {
      "name": "Musyawarah Besar (Mubes)",
      "desc": "Forum laporan pertanggungjawaban akhir periode serta pemilihan Ketua Himpunan baru.",
      "status": "Terencana",
      "date": "Desember 2026"
    },
    {
      "name": "Evaluasi Tengah Periode",
      "desc": "Peninjauan kinerja tengah periode seluruh divisi dan evaluasi keuangan.",
      "status": "Terencana",
      "date": "September 2026"
    }
  ],
  "KOMINFO": [
    {
      "name": "Pemberitaan & Media Sosial",
      "desc": "Diseminasi informasi kegiatan, info akademik, dan prestasi via Instagram/TikTok.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    },
    {
      "name": "Portal Website HMTE",
      "desc": "Pengembangan fitur direktori interaktif dan publikasi konten berita terkini.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    },
    {
      "name": "Buletin Elektro",
      "desc": "Penerbitan artikel edukasi, riset, dan opini kemahasiswaan dalam format majalah digital.",
      "status": "Terencana",
      "date": "Mulai Juli 2026"
    }
  ],
  "IPTEK": [
    {
      "name": "Mechanical Fair UGM",
      "desc": "Penyelenggaraan kompetisi robotika nasional bergengsi berkolaborasi dengan SV UGM.",
      "status": "Selesai",
      "date": "Maret 2026"
    },
    {
      "name": "Workshop Embedded & IoT",
      "desc": "Pelatihan intensif perancangan sirkuit mikroelektronika dan pemrograman mikrokontroler.",
      "status": "Sedang Berjalan",
      "date": "Juni 2026"
    },
    {
      "name": "Electro Research Camp",
      "desc": "Fasilitasi pembimbingan dan inkubasi karya tulis ilmiah / proyek tugas akhir mahasiswa.",
      "status": "Terencana",
      "date": "Oktober 2026"
    }
  ],
  "PSDM": [
    {
      "name": "LDKM Elektro",
      "desc": "Latihan Dasar Kepemimpinan Mahasiswa untuk menumbuhkan jiwa kepemimpinan anggota baru.",
      "status": "Terencana",
      "date": "September 2026"
    },
    {
      "name": "Makrab Elektro",
      "desc": "Malam keakraban lintas angkatan untuk mempererat hubungan mahasiswa aktif TRE UGM.",
      "status": "Terencana",
      "date": "November 2026"
    },
    {
      "name": "Kaderisasi & Evaluasi",
      "desc": "Manajemen keaktifan anggota, konseling, dan pembagian sistem mentor internal.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    }
  ],
  "PHAL": [
    {
      "name": "Company Visit",
      "desc": "Kunjungan industri mahasiswa elektro ke perusahaan teknologi dan manufaktur terkemuka.",
      "status": "Terencana",
      "date": "Agustus 2026"
    },
    {
      "name": "Studi Banding Himpunan",
      "desc": "Kunjungan diskusi berbagi program kerja dengan himpunan elektro universitas mitra.",
      "status": "Selesai",
      "date": "Mei 2026"
    },
    {
      "name": "Database Alumni & Mitra",
      "desc": "Sinkronisasi database alumni elektro UGM untuk menunjang info karir dan magang.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    }
  ],
  "MINKAT": [
    {
      "name": "Electro League",
      "desc": "Penyelenggaraan turnamen olahraga futsal, basket, dan bulutangkis internal mahasiswa.",
      "status": "Selesai",
      "date": "April 2026"
    },
    {
      "name": "Electro Art Night",
      "desc": "Panggung ekspresi seni, musik, dan kreativitas mahasiswa menyambut mahasiswa baru.",
      "status": "Terencana",
      "date": "Oktober 2026"
    },
    {
      "name": "E-Sports Cup",
      "desc": "Penyelenggaraan turnamen game Mobile Legends dan Valorant antar mahasiswa SV UGM.",
      "status": "Terencana",
      "date": "Juli 2026"
    }
  ],
  "KASTRAD": [
    {
      "name": "Electro Speak Up",
      "desc": "Kanal penyerapan aspirasi fasilitas lab, kurikulum, dan masalah akademik mahasiswa.",
      "status": "Sedang Berjalan",
      "date": "Juni 2026"
    },
    {
      "name": "Kajian Isu Energi",
      "desc": "Penyusunan kajian kritis mengenai transisi energi dan potensi kendaraan listrik Indonesia.",
      "status": "Selesai",
      "date": "Mei 2026"
    },
    {
      "name": "Advokasi UKT & Beasiswa",
      "desc": "Pendampingan keringanan biaya kuliah (UKT) dan penyaluran info beasiswa mahasiswa.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    }
  ],
  "KEWIRUS": [
    {
      "name": "Electro Store",
      "desc": "Penyediaan merchandise resmi HMTE (jaket, kaos, lanyard) sebagai sumber pendanaan mandiri.",
      "status": "Sedang Berjalan",
      "date": "Sepanjang Periode"
    },
    {
      "name": "Workshop Technopreneur",
      "desc": "Seminar kewirausahaan berbasis teknologi digital bagi mahasiswa vokasi.",
      "status": "Terencana",
      "date": "September 2026"
    },
    {
      "name": "Inkubasi Usaha Mahasiswa",
      "desc": "Pemberian dana hibah stimulan kecil dan bimbingan bagi bisnis rintisan mahasiswa.",
      "status": "Terencana",
      "date": "Agustus 2026"
    }
  ]
} satisfies Record<DivisionCode, Program[]>
