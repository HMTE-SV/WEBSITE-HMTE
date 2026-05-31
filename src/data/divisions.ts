import type { Division, DivisionCode } from '@/types/content'

export const divisions = [
  {
    "code": "KOMINFO",
    "name": "Komunikasi dan Informasi",
    "shortName": "KOMINFO",
    "description": "Mengelola komunikasi organisasi, media sosial, website, dan arus informasi kepada mahasiswa dan publik.",
    "order": 1
  },
  {
    "code": "IPTEK",
    "name": "Ilmu Pengetahuan dan Teknologi",
    "shortName": "IPTEK",
    "description": "Mendorong pengembangan kapasitas teknis anggota melalui pelatihan, seminar, riset, dan kegiatan berbasis ilmu pengetahuan.",
    "order": 2
  },
  {
    "code": "PSDM",
    "name": "Pengembangan Sumber Daya Manusia",
    "shortName": "PSDM",
    "description": "Berfokus pada kaderisasi, pengembangan karakter, dan peningkatan kualitas sumber daya manusia di dalam organisasi.",
    "order": 3
  },
  {
    "code": "PHAL",
    "name": "Pengembangan Hubungan Antar Lembaga",
    "shortName": "PHAL",
    "description": "Membangun dan memelihara hubungan baik dengan lembaga internal kampus maupun organisasi mahasiswa eksternal.",
    "order": 4
  },
  {
    "code": "MINKAT",
    "name": "Minat dan Bakat",
    "shortName": "MINKAT",
    "description": "Memfasilitasi pengembangan minat dan bakat anggota melalui kegiatan olahraga, seni, dan aktivitas kreatif lainnya.",
    "order": 5
  },
  {
    "code": "KASTRAD",
    "name": "Kajian Strategis dan Advokasi",
    "shortName": "KASTRAD",
    "description": "Melakukan kajian isu strategis, advokasi kebijakan, dan memperkuat suara mahasiswa dalam pengambilan keputusan.",
    "order": 6
  },
  {
    "code": "KEWIRUS",
    "name": "Kewirausahaan",
    "shortName": "KEWIRUS",
    "description": "Menumbuhkan jiwa wirausaha anggota melalui pelatihan bisnis, inkubasi ide, dan kegiatan ekonomi kreatif mahasiswa.",
    "order": 7
  },
  {
    "code": "PH",
    "name": "Pengurus Harian",
    "shortName": "PH",
    "description": "Mengoordinasikan arah strategis, administrasi keuangan, kesekretariatan, dan manajemen internal organisasi secara menyeluruh.",
    "order": 8
  }
] satisfies Division[]

export const leadershipDivisionOrder = [
  "PH",
  "KOMINFO",
  "IPTEK",
  "PSDM",
  "PHAL",
  "MINKAT",
  "KASTRAD",
  "KEWIRUS"
] satisfies DivisionCode[]

export const divisionsByCode = Object.fromEntries(
  divisions.map((division) => [division.code, division]),
) as Record<DivisionCode, Division>
