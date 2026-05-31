import type { EventItem } from '@/types/content'

export const events = [
  {
    id: 'workshop-embedded-iot',
    title: 'Workshop Embedded & IoT',
    excerpt:
      'Pelatihan intensif perancangan sirkuit mikroelektronika dan pemrograman mikrokontroler untuk mahasiswa TRE.',
    date: 'Juni 2026',
    location: 'Departemen Teknik Elektro dan Informatika SV UGM',
    status: 'published',
  },
  {
    id: 'company-visit',
    title: 'Company Visit',
    excerpt:
      'Kunjungan industri mahasiswa elektro ke perusahaan teknologi dan manufaktur terkemuka.',
    date: 'Agustus 2026',
    location: 'Mitra industri HMTE',
    status: 'published',
  },
  {
    id: 'ldkm-elektro',
    title: 'LDKM Elektro',
    excerpt:
      'Latihan Dasar Kepemimpinan Mahasiswa untuk menumbuhkan jiwa kepemimpinan anggota baru.',
    date: 'September 2026',
    location: 'Sekolah Vokasi UGM',
    status: 'published',
  },
] satisfies EventItem[]
