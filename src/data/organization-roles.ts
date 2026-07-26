import type { DivisionCode } from '@/types/content'

export type OrganizationRole = {
  name: string
  description: string
}

const departmentRoles = [
  {
    name: 'Kepala Departemen',
    description:
      'Memimpin, mengoordinasikan, dan mengawasi kegiatan serta program kerja departemen.',
  },
  {
    name: 'Wakil Kepala Departemen',
    description:
      'Membantu kepala departemen, mengoordinasikan anggota, dan menggantikan kepala ketika berhalangan.',
  },
  {
    name: 'Sekretaris dan Bendahara Departemen',
    description:
      'Mengelola administrasi, proposal, laporan, arsip, serta keuangan departemen.',
  },
  {
    name: 'Staf Departemen',
    description:
      'Memberikan ide, menjalankan tugas dan program kerja, serta menjaga komunikasi dan kolaborasi.',
  },
] satisfies OrganizationRole[]

export const organizationRolesByDivision = {
  PH: [
    {
      name: 'Dewan Penasihat dan Dewan Pelindung',
      description: 'Berada pada jalur koordinasi dengan Ketua Umum dalam struktur HMTE.',
    },
    {
      name: 'Ketua Umum / Ketua Himpunan',
      description:
        'Memimpin HMTE serta bertanggung jawab atas anggota, kegiatan, dan rapat organisasi.',
    },
    {
      name: 'Sekretaris Jenderal',
      description:
        'Mengoordinasikan departemen, menjembatani PH dan departemen, serta mewakili ketua ketika berhalangan.',
    },
    {
      name: 'Sekretaris I dan Sekretaris II',
      description:
        'Mengelola kesekretariatan, nomor surat, laporan pertanggungjawaban, arsip, dan notulensi.',
    },
    {
      name: 'Bendahara Umum',
      description: 'Mengelola dan mencatat keuangan HMTE serta koordinasi kas departemen.',
    },
    {
      name: 'Ketua Angkatan dan Badan Semi Otonom',
      description: 'Berada pada jalur koordinasi Pengurus Harian sesuai bagan organisasi.',
    },
  ],
  PSDM: departmentRoles,
  PHAL: departmentRoles,
  MINKAT: departmentRoles,
  KOMINFO: departmentRoles,
  IPTEK: departmentRoles,
  KEWIRUS: departmentRoles,
  KASTRAD: departmentRoles,
} satisfies Record<DivisionCode, OrganizationRole[]>
