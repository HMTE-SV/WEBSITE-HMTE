import type { FooterColumn, GalleryCard, NavLink, PartnerTile } from '@/types/content'

export const siteNavLinks = [
  {
    "label": "Beranda",
    "href": "/"
  },
  {
    "label": "Halaman",
    "href": "/galeri"
  },
  {
    "label": "Berita",
    "href": "/berita"
  },
  {
    "label": "Program",
    "href": "/program-kerja"
  },
  {
    "label": "Kontak",
    "href": "/kontak"
  }
] satisfies NavLink[]

export const heroPhotoTiles = Array.from({ length: 32 }, (_, index) => ({
  label: `Foto kegiatan ${index + 1}`,
}))

export const heroIdentity = {
  titleLineOne: 'Himpunan Mahasiswa',
  titleLineTwo: 'Teknik Elektro',
  program: 'Teknologi Rekayasa Elektro',
  department: 'Departemen Teknik Elektro dan Informatika',
  faculty: 'Sekolah Vokasi',
  university: 'Universitas Gadjah Mada',
}

export const newsAgendaIntro = {
  sectionNumber: '01',
  kicker: 'Berita & Agenda',
  title: 'Kabar kegiatan dan agenda HMTE',
  lead:
    'Ikuti perkembangan informasi akademik, prestasi mahasiswa, lowongan magang, proyek akhir, serta pengabdian masyarakat di lingkungan Departemen Teknik Elektro dan Informatika (DTEDI) Sekolah Vokasi UGM.',
}

export const galleryIntro = {
  sectionNumber: '02',
  kicker: 'NAVIGASI HALAMAN',
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
  sectionNumber: '03',
  kicker: 'STRUKTUR KABINET',
  title: 'Bidang',
  mutedTitle: ' & divisi',
  lead:
    'Kabinet HMTE TRE SV UGM terdiri dari tujuh bidang yang bekerja secara kolaboratif untuk menggerakkan roda organisasi, mengembangkan potensi anggota, dan mempererat hubungan internal maupun eksternal.',
}

export const leadershipIntro = {
  sectionNumber: '04',
  kicker: 'KEPENGURUSAN',
  titleNumber: '08',
  titleLabel: 'BIDANG',
  lead:
    'Delapan bidang kabinet HMTE TRE SV UGM (termasuk Pengurus Harian), masing-masing diisi oleh pengurus yang berkomitmen menjalankan program kerja selama satu periode kepengurusan.',
}

export const partnersIntro = {
  sectionNumber: '05',
  kicker: 'JEJARING',
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
  sectionNumber: '06',
  kicker: 'KONTAK HMTE',
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
        "label": "Prestasi",
        "href": "/berita"
      },
      {
        "label": "Galeri",
        "href": "/galeri"
      },
      {
        "label": "Alumni",
        "href": "/berita"
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
        "label": "Email resmi perlu dikonfirmasi",
        "href": "#"
      },
      {
        "label": "Kanal aspirasi perlu dikonfirmasi",
        "href": "/aspirasi"
      },
      {
        "label": "Sekretariat perlu dikonfirmasi",
        "href": "#"
      }
    ]
  }
] satisfies FooterColumn[]
