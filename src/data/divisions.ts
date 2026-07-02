import type { Division, DivisionCode } from '@/types/content'

export const divisions = [
  {
    "code": "KOMINFO",
    "name": "Komunikasi dan Informasi",
    "shortName": "KOMINFO",
    "description": "Mengelola media sosial, website, dan arus informasi himpunan.",
    "order": 1
  },
  {
    "code": "IPTEK",
    "name": "Ilmu Pengetahuan dan Teknologi",
    "shortName": "IPTEK",
    "description": "Mengembangkan kapasitas teknis anggota lewat pelatihan, seminar, dan riset.",
    "order": 2
  },
  {
    "code": "PSDM",
    "name": "Pengembangan Sumber Daya Manusia",
    "shortName": "PSDM",
    "description": "Menangani kaderisasi dan pengembangan karakter anggota.",
    "order": 3
  },
  {
    "code": "PHAL",
    "name": "Pengembangan Hubungan Antar Lembaga",
    "shortName": "PHAL",
    "description": "Menjaga hubungan dengan lembaga kampus dan organisasi eksternal.",
    "order": 4
  },
  {
    "code": "MINKAT",
    "name": "Minat dan Bakat",
    "shortName": "MINKAT",
    "description": "Mewadahi minat dan bakat anggota di olahraga, seni, dan kegiatan kreatif.",
    "order": 5
  },
  {
    "code": "KASTRAD",
    "name": "Kajian Strategis dan Advokasi",
    "shortName": "KASTRAD",
    "description": "Mengkaji isu strategis dan mengadvokasi suara mahasiswa.",
    "order": 6
  },
  {
    "code": "KEWIRUS",
    "name": "Kewirausahaan",
    "shortName": "KEWIRUS",
    "description": "Menumbuhkan jiwa wirausaha lewat pelatihan bisnis dan ekonomi kreatif.",
    "order": 7
  },
  {
    "code": "PH",
    "name": "Pengurus Harian",
    "shortName": "PH",
    "description": "Mengoordinasikan arah strategis, keuangan, dan administrasi organisasi.",
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
