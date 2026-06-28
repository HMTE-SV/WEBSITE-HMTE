import type { FooterColumn, GalleryCard, NavItem, PartnerTile } from '@/types/content'

export const siteNav = [
  {
    label: 'Beranda',
    href: '/',
  },
  {
    label: 'Organisasi',
    children: [
      { label: 'Kepengurusan', href: '/kepengurusan' },
      { label: 'Divisi', href: '/divisi' },
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
  {
    label: 'Galeri',
    href: '/galeri',
  },
  {
    label: 'Aspirasi',
    href: '/aspirasi',
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
    'Ruang kabar, agenda, dan kegiatan mahasiswa Teknik Elektro Sekolah Vokasi UGM — diperbarui mengikuti gerak organisasi.',
  ctaLabel: 'Lihat agenda & kabar terbaru',
  ctaHref: '#stats',
}

export const newsAgendaIntro = {
  title: 'Kabar kegiatan dan agenda HMTE',
  lead:
    'Ikuti perkembangan informasi akademik, prestasi mahasiswa, lowongan magang, proyek akhir, serta pengabdian masyarakat di lingkungan Departemen Teknik Elektro dan Informatika (DTEDI) Sekolah Vokasi UGM.',
}

export const galleryIntro = {
  title: 'Navigasi cepat untuk halaman yang perlu ada di website HMTE',
  hubKicker: 'Navigasi cepat',
  hubTitle: 'Peta halaman HMTE.',
  stats: [
    { value: '10', label: 'Halaman arah' },
    { value: '03', label: 'Status data' },
  ],
}

export const galleryCards = [
  {
    "kicker": "Tentang",
    "status": "confirmed",
    "statusLabel": "Terkonfirmasi",
    "title": "Identitas organisasi",
    "description": "Profil HMTE TRE SV UGM dan relasi kelembagaan dengan TRE, DTEDI, SV UGM, dan UGM.",
    "href": "/kontak",
    "linkLabel": "Buka tentang →"
  },
  {
    "kicker": "Kepengurusan",
    "status": "indicated",
    "statusLabel": "Indikasi publik",
    "title": "Pengurus & divisi",
    "description": "Ruang untuk struktur pengurus, bidang/divisi, dan foto resmi yang masih perlu dikonfirmasi.",
    "href": "/kepengurusan",
    "linkLabel": "Lihat struktur →"
  },
  {
    "kicker": "Program kerja",
    "status": "pending",
    "statusLabel": "Perlu konfirmasi",
    "title": "Agenda & proker",
    "description": "Agenda, kegiatan, program kerja, dan arsip kemahasiswaan yang nanti diganti dengan data resmi.",
    "href": "/program-kerja",
    "linkLabel": "Buka ledger →"
  },
  {
    "kicker": "Publikasi",
    "status": "indicated",
    "statusLabel": "Indikasi publik",
    "title": "Berita, galeri, alumni",
    "description": "Berita, prestasi, galeri, alumni, kontak, dan kolaborasi disiapkan sebagai halaman mudah dipindai.",
    "href": "/berita",
    "linkLabel": "Lihat publikasi →"
  }
] satisfies GalleryCard[]

export const kabinetIntro = {
  title: 'Bidang',
  mutedTitle: ' & divisi',
  lead:
    'Kabinet HMTE TRE SV UGM terdiri dari tujuh bidang yang bekerja secara kolaboratif untuk menggerakkan roda organisasi, mengembangkan potensi anggota, dan mempererat hubungan internal maupun eksternal.',
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
    'Jejaring HMTE disiapkan untuk mahasiswa, pengurus, alumni, dosen pembina, mitra kegiatan, sponsor, dan relasi industri. Detail final tetap menunggu data resmi.',
}

export const partnerTiles = [
  {
    "label": "Mahasiswa Elektro",
    "status": "Terkonfirmasi"
  },
  {
    "label": "Pengurus HMTE",
    "status": "Perlu cek"
  },
  {
    "label": "Alumni",
    "status": "Perlu cek"
  },
  {
    "label": "Dosen Pembina",
    "status": "Perlu cek"
  },
  {
    "label": "Mitra Kegiatan",
    "status": "Perlu cek"
  },
  {
    "label": "Relasi Industri",
    "status": "Indikasi"
  },
  {
    "label": "Prestasi",
    "status": "Publik awal"
  },
  {
    "label": "Aspirasi",
    "status": "Perlu kanal"
  }
] satisfies PartnerTile[]

export const ctaContent = {
  titleLineOne: 'Kirim data',
  titleMuted: 'resmi',
  titleLineThree: 'HMTE',
  body:
    'Website ini siap menjadi draft resmi HMTE TRE SV UGM. Bagian logo, struktur pengurus, divisi, proker, galeri, kontak, alumni, dan partner masih perlu dikunci bersama pengurus.',
  deadlineLabel: 'Prinsip data',
  deadlineValue: 'Jujur / Valid / Siap isi',
  primaryAction: 'Kirim data resmi',
  secondaryAction: 'Lihat checklist',
}

export const footerContent = {
  wordmark: 'HMTE TRE SV UGM',
  addressLines: [
    ['Himpunan Mahasiswa Teknik Elektro', 'Teknologi Rekayasa Elektro · Sekolah Vokasi UGM'],
    ['Departemen Teknik Elektro dan Informatika', 'Universitas Gadjah Mada', 'Elektro... Satu!!!'],
  ],
  bottomLeft: '© 2026 HMTE TRE SV UGM · SEKOLAH VOKASI UNIVERSITAS GADJAH MADA',
  bottomRight: 'TERKONFIRMASI · INDIKASI PUBLIK · PERLU KONFIRMASI',
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
        "label": "Kepengurusan",
        "href": "/kepengurusan"
      },
      {
        "label": "Divisi",
        "href": "/divisi"
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
        "label": "Email resmi — segera",
        "href": "#"
      },
      {
        "label": "Sekretariat — segera",
        "href": "#"
      }
    ]
  }
] satisfies FooterColumn[]
