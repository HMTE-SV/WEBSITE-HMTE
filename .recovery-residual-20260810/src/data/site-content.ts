import type { FooterColumn, NavItem, PartnerTile } from '@/types/content'

/** Nilai fallback lama; navigasi terbit sekarang dibaca dari settings/site. */
export const siteNav = [
  {
    label: 'Beranda',
    href: '/',
  },
  {
    label: 'Tentang HMTE',
    href: '/#tentang',
  },
  {
    label: 'Organisasi',
    children: [
      { label: 'Kepengurusan', href: '/kepengurusan' },
      { label: 'Program Kerja', href: '/program-kerja' },
    ],
  },
  {
    label: 'Kabar',
    children: [
      { label: 'Berita', href: '/berita' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Pengumuman', href: '/pengumuman' },
      { label: 'Galeri', href: '/galeri' },
    ],
  },
  /*
   * /aspirasi dan /kontak sebelumnya hanya bisa dicapai dari kaki halaman,
   * padahal ajakan di beranda justru mengirim orang ke keduanya. Menaruh
   * tujuannya di kaki dan ajakannya di tengah halaman membuat pengunjung yang
   * melewatkan tombol itu tidak punya jalan lain.
   */
  {
    label: 'Terhubung',
    children: [
      { label: 'Aspirasi', href: '/aspirasi' },
      { label: 'Kontak', href: '/kontak' },
    ],
  },
] satisfies NavItem[]

export const heroActivityImages = [
  { src: '/assets/abya-vistara/kegiatan-01.webp', alt: 'Anggota HMTE berinteraksi dalam kegiatan kebersamaan' },
  { src: '/assets/abya-vistara/kegiatan-02.webp', alt: 'Barisan anggota HMTE mengikuti permainan kelompok' },
  { src: '/assets/abya-vistara/kegiatan-03.webp', alt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang' },
  { src: '/assets/abya-vistara/kabinet-01.webp', alt: 'Foto Kabinet Abya Vistara di halaman kampus UGM' },
  { src: '/assets/abya-vistara/kabinet-02.webp', alt: 'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan' },
  { src: '/assets/abya-vistara/kabinet-03.webp', alt: 'Foto bersama pengurus HMTE periode 2026/2027' },
]

export const heroIdentity = {
  name: 'Himpunan Mahasiswa Teknik Elektro',
  context: 'Program Studi Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  tagline:
    'Rumah bertumbuh yang nyaman, inovatif, dan produktif untuk berkembang bersama serta memberi dampak lebih luas.',
  ctaLabel: 'Kenali Abya Vistara',
  ctaHref: '#tentang',
}

/*
 * Dua lead, bukan satu.
 *
 * `lead` bertutur dalam bentuk masa depan ("akan hadir setelah diverifikasi"),
 * jadi ia hanya masuk akal saat arsip masih kosong. Dipakai juga di atas berita
 * yang sudah terbit, kalimat itu terbaca seperti teks sementara yang lupa
 * diganti — dan itulah kesan yang justru harus dihindari di beranda.
 */
export const newsAgendaIntro = {
  title: 'Ruang kabar HMTE',
  lead:
    'Publikasi resmi kegiatan, prestasi, peluang, dan gagasan mahasiswa akan hadir setelah informasinya diverifikasi oleh pengurus.',
  leadPublished:
    'Catatan resmi kegiatan, prestasi, dan peluang mahasiswa Teknologi Rekayasa Elektro — diverifikasi pengurus sebelum diterbitkan.',
}

export const getToKnowContent = {
  identity: 'Kabinet Abya Vistara',
  period: 'Periode 2026/2027',
  context: 'Program Studi Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  prologue: {
    kicker: 'Tentang HMTE',
    titleLines: ['Rumah untuk', 'bertumbuh bersama.'],
    body:
      'HMTE adalah organisasi kemahasiswaan resmi di bawah Program Studi Teknologi Rekayasa Elektro, Sekolah Vokasi, Universitas Gadjah Mada.',
  },
  finale: {
    line: 'Abya Vistara.',
    caption: 'Kabinet HMTE · Periode 2026/2027',
  },
  steps: [
    {
      label: 'Siapa kami',
      title: 'Wadah mahasiswa Teknologi Rekayasa Elektro.',
      body:
        'HMTE menjadi ruang pengembangan diri, penyaluran aspirasi, forum diskusi, dan inkubator gagasan yang melengkapi proses pendidikan formal mahasiswa.',
    },
    {
      label: 'Visi',
      title: 'Nyaman. Inovatif. Produktif.',
      body:
        'Menjadikan HMTE sebagai rumah bertumbuh yang nyaman, inovatif, dan produktif untuk berkembang bersama, serta memberikan kontribusi dan dampak yang lebih luas bagi anggota, lingkungan kampus, dan masyarakat.',
    },
    {
      label: 'Misi',
      title: 'Terbuka. Relevan. Kolaboratif. Berdampak.',
      body:
        'Membangun lingkungan yang suportif dan inklusif; mengoptimalkan media informasi; menghadirkan pengembangan diri yang relevan; memberi pengalaman organisasi yang bermakna bagi mahasiswa baru; serta mendorong program kolaboratif yang berdampak.',
    },
  ],
}

/**
 * Nilai bawaan tahun papan /agenda.
 *
 * Sumber yang sesungguhnya sekarang `settings/site` di Firestore, diubah dari
 * /admin/settings. Yang di sini dipakai kalau dokumen itu belum ada atau gagal
 * dibaca, dan oleh `getAgendaYear()` yang harus tetap murni tanpa Firebase.
 *
 * Sengaja konstanta, bukan `new Date().getFullYear()`. Papan menggambar tahun
 * periode kepengurusan, dan garis "hari ini" perlu tahu apakah hari ini memang
 * jatuh di tahun itu. Kalau ikut jam sistem, papan berubah diam-diam tiap 1
 * Januari tanpa ada yang memutuskannya.
 */
export const agendaYear = 2026

export const kabinetIntro = {
  title: 'Pengurus Harian',
  mutedTitle: ' & departemen',
  lead:
    'Kabinet Abya Vistara menyatukan Pengurus Harian dan tujuh departemen. Delapan unsur ini bergerak selaras, dengan Pengurus Harian sebagai pusat koordinasi dan penjaga arah organisasi.',
}

export const leadershipIntro = {
  titleNumber: '08',
  titleLabel: 'UNSUR',
  lead:
    'Struktur Kabinet Abya Vistara terdiri atas Pengurus Harian dan tujuh departemen yang menjalankan arah kerja HMTE periode 2026/2027.',
}

export const partnersIntro = {
  titleLineOne: 'Koordinasi, relasi,',
  titleMuted: 'dan ruang',
  titleLineThree: 'kolaborasi',
  lead:
    'Struktur dan program Kabinet Abya Vistara menghubungkan mahasiswa, pengurus, unsur pendamping, ketua angkatan, BSO, alumni, dan mitra kegiatan.',
}

export const partnerTiles = [
  {
    label: 'Mahasiswa Elektro',
    role: 'Mahasiswa Program Studi Teknologi Rekayasa Elektro',
  },
  {
    label: 'Pengurus Harian',
    role: 'Pusat koordinasi Kabinet Abya Vistara',
  },
  {
    label: 'Tujuh Departemen',
    role: 'Pelaksana bidang kerja dan program departemen',
  },
  {
    label: 'Dewan Penasihat & Pelindung',
    role: 'Unsur pendamping dalam struktur organisasi',
  },
  {
    label: 'Ketua Angkatan',
    role: 'Unsur koordinasi yang tercantum pada struktur',
  },
  {
    label: 'BSO',
    role: 'Badan semi otonom dalam jalur koordinasi',
  },
  {
    label: 'Alumni',
    role: 'Terhubung melalui program reuni dan hubungan alumni',
  },
  {
    label: 'Mitra Kegiatan',
    role: 'Ruang kolaborasi, studi banding, dan kunjungan industri',
  },
] satisfies PartnerTile[]

export const ctaContent = {
  titleLineOne: 'Terhubung',
  titleMuted: 'dengan',
  titleLineThree: 'HMTE',
  body:
    'Punya ide, pertanyaan, atau ajakan kolaborasi? HMTE TRE SV UGM terbuka untuk mahasiswa, alumni, dan mitra. Sampaikan aspirasimu atau hubungi pengurus lewat kanal resmi.',
  deadlineLabel: 'Kanal resmi',
  deadlineValue: 'Instagram @hmteugm',
  primaryAction: 'Sampaikan aspirasi',
  secondaryAction: 'Hubungi pengurus',
}

/*
 * Nama kabinet, periode, tahun, dan semboyan sudah pindah ke settings/site dan
 * diubah dari /admin/settings. Yang tersisa di sini hanya nama lembaga, yang
 * tidak berganti bersama kepengurusan.
 */
export const footerContent = {
  organizationName: 'Himpunan Mahasiswa Teknik Elektro',
}

/** Nilai fallback historis; footer terbit sekarang dibaca dari settings/site. */
export const footerColumns = [
  {
    "title": "Organisasi",
    "links": [
      {
        "label": "Tentang",
        "href": "/#tentang"
      },
      {
        "label": "Kepengurusan",
        "href": "/kepengurusan"
      },
      {
        "label": "Program Kerja",
        "href": "/program-kerja"
      }
    ]
  },
  {
    "title": "Mahasiswa",
    "links": [
      {
        "label": "Berita",
        "href": "/berita"
      },
      {
        "label": "Agenda",
        "href": "/agenda"
      },
      {
        "label": "Pengumuman",
        "href": "/pengumuman"
      },
      {
        "label": "Galeri",
        "href": "/galeri"
      }
    ]
  },
  {
    "title": "Kontak",
    "links": [
      {
        "label": "@hmteugm",
        "href": "https://www.instagram.com/hmteugm"
      },
      {
        "label": "hmte.ugm.ac.id",
        "href": "https://hmte.ugm.ac.id"
      },
      {
        "label": "Aspirasi mahasiswa",
        "href": "/aspirasi"
      },
      {
        "label": "Halaman kontak",
        "href": "/kontak"
      }
    ]
  }
] satisfies FooterColumn[]
