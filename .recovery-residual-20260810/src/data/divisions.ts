import type { Division, DivisionCode } from '@/types/content'

export const divisions = [
  {
    code: 'PH',
    name: 'Pengurus Harian',
    shortName: 'PH',
    description:
      'Mengoordinasikan arah kerja organisasi serta mengelola administrasi, pengarsipan, dan keuangan HMTE Periode 2026/2027.',
    "order": 1
  },
  {
    code: 'PSDM',
    name: 'Pengembangan Sumber Daya Manusia',
    shortName: 'PSDM',
    description:
      'Menjalankan kaderisasi, pembinaan karakter, pengembangan kepemimpinan, serta penguatan kekeluargaan dan solidaritas anggota.',
    "order": 2
  },
  {
    code: 'PHAL',
    name: 'Pengembangan Hubungan Antar Lembaga',
    shortName: 'PHAL',
    description:
      'Membangun hubungan dan kerja sama dengan organisasi mahasiswa, institusi pendidikan, dunia industri, alumni, dan mitra terkait.',
    "order": 3
  },
  {
    code: 'MINKAT',
    name: 'Minat dan Bakat',
    shortName: 'MINKAT',
    description:
      'Menjaring, membina, dan memfasilitasi minat, bakat, prestasi, kreativitas, dan sportivitas mahasiswa TRE.',
    "order": 4
  },
  {
    code: 'KOMINFO',
    name: 'Komunikasi dan Informasi',
    shortName: 'KOMINFO',
    description:
      'Mengelola informasi, publikasi, dokumentasi, media komunikasi, identitas visual, dan citra HMTE.',
    "order": 5
  },
  {
    code: 'IPTEK',
    name: 'Ilmu Pengetahuan dan Teknologi',
    shortName: 'IPTEK',
    description:
      'Mendukung pengembangan akademik dan teknologi melalui media pembelajaran, pelatihan, pendampingan, dan sarana digital.',
    "order": 6
  },
  {
    code: 'KEWIRUS',
    name: 'Kewirausahaan',
    shortName: 'KEWIRUS',
    description:
      'Mengembangkan jiwa kewirausahaan, kreativitas, dan kemandirian mahasiswa sekaligus mendukung kemandirian finansial HMTE.',
    "order": 7
  },
  {
    code: 'KASTRAD',
    name: 'Kajian Strategis dan Advokasi',
    shortName: 'KASTRAD',
    description:
      'Menghimpun aspirasi, melaksanakan kajian strategis, menyediakan informasi akademik, dan menjembatani mahasiswa dengan pihak terkait.',
    "order": 8
  }
] satisfies Division[]

export const leadershipDivisionOrder = [
  'PH',
  'PSDM',
  'PHAL',
  'MINKAT',
  'KOMINFO',
  'IPTEK',
  'KEWIRUS',
  'KASTRAD',
] satisfies DivisionCode[]

export const divisionsByCode = Object.fromEntries(
  divisions.map((division) => [division.code, division]),
) as Record<DivisionCode, Division>
