import type { FooterColumn, NavItem, PartnerTile } from '@/types/content'

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
      { label: 'Bidang & Divisi', href: '/divisi' },
      { label: 'Pengurus', href: '/kepengurusan' },
      { label: 'Program Kerja', href: '/program-kerja' },
    ],
  },
  {
    label: 'Kabar',
    children: [
      { label: 'Berita', href: '/berita' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Pengumuman', href: '/pengumuman' },
    ],
  },
] satisfies NavItem[]

export const heroActivityImages = [
  { src: '/assets/ugm_socialization.png', alt: 'Mahasiswa mengikuti seminar keinsinyuran di ruang kuliah' },
  { src: '/assets/robotics_prestige.png', alt: 'Tim mahasiswa menyiapkan robot untuk kompetisi robotika' },
  { src: '/assets/smart_grid_dashboard.png', alt: 'Pengujian dasbor smart grid di laboratorium elektro' },
  { src: '/assets/solar_village.png', alt: 'Mahasiswa memasang lampu tenaga surya dalam pengabdian masyarakat' },
  { src: '/assets/semiconductor_career.png', alt: 'Mahasiswa di ruang bersih fasilitas semikonduktor' },
]

export const heroIdentity = {
  name: 'Himpunan Mahasiswa Teknik Elektro',
  context: 'Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  tagline:
    'Ruang kabar, agenda, dan dokumentasi kegiatan: dari himpunan, untuk mahasiswa.',
  ctaLabel: 'Jelajahi kabar terbaru',
  ctaHref: '#kabar',
}

export const newsAgendaIntro = {
  title: 'Kabar kegiatan dan agenda HMTE',
  lead:
    'Informasi akademik, prestasi mahasiswa, magang, proyek akhir, dan pengabdian masyarakat di lingkungan DTEDI Sekolah Vokasi UGM.',
}

export const getToKnowContent = {
  identity: 'Kabinet HMTE',
  period: 'Periode 2026',
  context: 'Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  steps: [
    {
      label: 'Siapa kami',
      title: 'Bukan sekadar kepengurusan.',
      body:
        'HMTE adalah ruang temu mahasiswa Elektro untuk belajar bersama, menguji gagasan, dan mengubah kebutuhan sehari-hari menjadi gerakan yang nyata.',
    },
    {
      label: 'Visi',
      title: 'Ruang tumbuh yang saling menguatkan.',
      body:
        'Kami ingin setiap mahasiswa merasa punya tempat untuk berkembang—secara teknis, sosial, maupun personal—tanpa harus berjalan sendirian.',
    },
    {
      label: 'Misi',
      title: 'Belajar. Bergerak. Membawa dampak.',
      body:
        'Menghubungkan pengembangan kompetensi, advokasi mahasiswa, ekspresi minat, dan kolaborasi menjadi pengalaman organisasi yang relevan dan bisa dirasakan.',
    },
  ],
}

export const kabinetIntro = {
  title: 'Bidang',
  mutedTitle: ' & divisi',
  lead:
    'Kabinet HMTE TRE SV UGM digerakkan Pengurus Harian dan tujuh bidang yang bekerja kolaboratif untuk menjalankan organisasi, mengembangkan potensi anggota, dan mempererat hubungan internal maupun eksternal.',
}

export const leadershipIntro = {
  titleNumber: '08',
  titleLabel: 'BIDANG',
  lead:
    'Delapan bidang kabinet HMTE TRE SV UGM (termasuk Pengurus Harian), masing-masing diisi oleh pengurus yang berkomitmen menjalankan program kerja selama satu periode kepengurusan.',
}

export const partnersIntro = {
  titleLineOne: 'Alumni, mitra,',
  titleMuted: 'dan ruang',
  titleLineThree: 'kolaborasi',
  lead:
    'Jejaring HMTE menghubungkan mahasiswa, pengurus, alumni, dosen pembina, mitra kegiatan, sponsor, dan relasi industri di lingkungan Teknologi Rekayasa Elektro Sekolah Vokasi UGM.',
}

export const partnerTiles = [
  {
    label: 'Mahasiswa Elektro',
    role: 'Anggota himpunan, pusat seluruh kegiatan',
  },
  {
    label: 'Pengurus HMTE',
    role: 'Penggerak program kerja lintas bidang',
  },
  {
    label: 'Alumni',
    role: 'Jejaring karier dan mentoring lintas angkatan',
  },
  {
    label: 'Dosen Pembina',
    role: 'Pendamping arah organisasi dan akademik',
  },
  {
    label: 'Mitra Kegiatan',
    role: 'Kolaborator acara, pelatihan, dan kompetisi',
  },
  {
    label: 'Relasi Industri',
    role: 'Kanal magang, kunjungan, dan praktik industri',
  },
  {
    label: 'Sponsor',
    role: 'Pendukung pendanaan dan fasilitas kegiatan',
  },
  {
    label: 'Masyarakat',
    role: 'Penerima manfaat program pengabdian',
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

export const footerContent = {
  addressLines: [
    ['Himpunan Mahasiswa Teknik Elektro', 'Teknologi Rekayasa Elektro · Sekolah Vokasi UGM'],
    ['Departemen Teknik Elektro dan Informatika', 'Universitas Gadjah Mada'],
  ],
  bottomLeft: '© 2026 HMTE TRE SV UGM · SEKOLAH VOKASI UNIVERSITAS GADJAH MADA',
  bottomRight: 'ELEKTRO... SATU!!!',
}

export const footerColumns = [
  {
    "title": "Organisasi",
    "links": [
      {
        "label": "Tentang",
        "href": "/kontak"
      },
      {
        "label": "Bidang & Divisi",
        "href": "/divisi"
      },
      {
        "label": "Pengurus",
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
