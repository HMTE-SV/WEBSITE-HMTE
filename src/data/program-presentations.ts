import type { DivisionCode } from '@/types/content'

export type ProgramTimelineItem = {
  date: string
  description: string
  label: string
  state: 'scheduled'
}

export type ProgramDocumentItem = {
  format: string
  name: string
  status: 'Tersedia' | 'Segera tersedia'
}

export type FeaturedProgramPresentation = {
  divisionCode: DivisionCode
  documents: ProgramDocumentItem[]
  focus: string[]
  image: string
  programName: string
  summary: string
  tagline: string
  timeline: ProgramTimelineItem[]
}

export const featuredProgramPresentations = [
  {
    divisionCode: 'PSDM',
    programName: 'TORSI',
    image: '/assets/abya-vistara/kegiatan-02.webp',
    tagline: 'Pembekalan awal bagi seluruh pengurus HMTE.',
    summary:
      'TORSI (Training Organization and Study for Engineering) mempersiapkan seluruh pengurus dengan pemahaman dasar mengenai organisasi, administrasi, kepemimpinan, dan tata kelola kegiatan selama satu periode.',
    focus: [
      'Kesiapan pengurus menjalankan tanggung jawab organisasi',
      'Pengembangan hard skill dan soft skill',
      'Kebersamaan dan kekeluargaan antarpengurus',
    ],
    timeline: [
      {
        date: 'April',
        label: 'Pelatihan Dasar Organisasi',
        description:
          'Pembekalan dasar manajemen organisasi, kepemimpinan, koordinasi, dan tanggung jawab pengurus.',
        state: 'scheduled',
      },
      {
        date: 'April',
        label: 'Diskusi Terbuka',
        description:
          'Berbagi pengalaman dan transfer pengetahuan antara pengurus periode sebelumnya dengan pengurus baru.',
        state: 'scheduled',
      },
      {
        date: 'April',
        label: 'Pengenalan Dokumen Organisasi',
        description:
          'Pengenalan administrasi, proposal, laporan pertanggungjawaban, pengarsipan, dan dokumen resmi HMTE.',
        state: 'scheduled',
      },
      {
        date: 'April',
        label: 'Fun & Games',
        description:
          'Kegiatan kebersamaan untuk mempererat hubungan dan membangun komunikasi internal pengurus.',
        state: 'scheduled',
      },
    ],
    documents: [],
  },
  {
    divisionCode: 'IPTEK',
    programName: 'HMTE Mengajar',
    image: '/assets/abya-vistara/kegiatan-01.webp',
    tagline: 'Transfer wawasan teknologi melalui pendidikan dan pengabdian masyarakat.',
    summary:
      'HMTE Mengajar mengenalkan ilmu dasar keelektroan dan teknologi kepada masyarakat, khususnya pelajar, sekaligus menjadi ruang pengembangan komunikasi, kepemimpinan, dan kepedulian sosial mahasiswa HMTE.',
    focus: [
      'Transfer wawasan teknologi',
      'Pengenalan citra positif Program Studi TRE',
      'Pendidikan dan pengabdian masyarakat',
    ],
    timeline: [
      {
        date: 'Oktober',
        label: 'Pelaksanaan Program',
        description:
          'Kegiatan edukatif berupa penyampaian materi, demonstrasi sederhana, diskusi, atau pelatihan dasar ilmu pengetahuan dan teknologi.',
        state: 'scheduled',
      },
    ],
    documents: [],
  },
  {
    divisionCode: 'MINKAT',
    programName: 'Elektro Cup',
    image: '/assets/abya-vistara/kegiatan-03.webp',
    tagline: 'Ruang minat, bakat, kreativitas, dan sportivitas lintas angkatan.',
    summary:
      'Elektro Cup mempertemukan seluruh angkatan aktif TRE melalui kegiatan olahraga, seni, dan kompetisi lain yang tetap menjunjung kebersamaan.',
    focus: [
      'Penyaluran minat dan bakat mahasiswa',
      'Sportivitas dan solidaritas',
      'Kekeluargaan lintas angkatan',
    ],
    timeline: [
      {
        date: 'September',
        label: 'Pelaksanaan Program',
        description:
          'Kegiatan olahraga, seni, atau kompetisi lain sebagai ruang penyaluran potensi nonakademik mahasiswa TRE.',
        state: 'scheduled',
      },
    ],
    documents: [],
  },
] satisfies FeaturedProgramPresentation[]
