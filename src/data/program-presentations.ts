import type { DivisionCode } from '@/types/content'

export type ProgramTimelineItem = {
  date: string
  description: string
  label: string
  state: 'done' | 'active' | 'upcoming'
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
    divisionCode: 'PH',
    programName: 'Rapat Kerja Himpunan',
    image: '/assets/ugm_socialization.png',
    tagline: 'Satu forum untuk menyelaraskan arah kerja seluruh kabinet.',
    summary:
      'Rapat Kerja Himpunan merangkum prioritas, indikator, kalender, dan kebutuhan kolaborasi seluruh bidang dalam satu dokumen kerja bersama.',
    focus: ['Penyelarasan target kabinet', 'Pengesahan kalender kerja', 'Pembagian dukungan lintas bidang'],
    timeline: [
      { date: 'Tahap 01', label: 'Konsolidasi', description: 'Pengumpulan rancangan program dari seluruh bidang.', state: 'done' },
      { date: 'Tahap 02', label: 'Sinkronisasi', description: 'Penyelarasan jadwal, anggaran, dan kebutuhan kolaborasi.', state: 'done' },
      { date: 'Juni 2026', label: 'Forum kerja', description: 'Pembahasan dan pengesahan roadmap kabinet.', state: 'active' },
      { date: 'Pasca forum', label: 'Publikasi', description: 'Finalisasi matriks program dan dokumen tindak lanjut.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Matriks Program Kerja Kabinet', format: 'XLSX', status: 'Segera tersedia' },
      { name: 'Notulensi Rapat Kerja', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Kalender Kerja 2026', format: 'PDF', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'KOMINFO',
    programName: 'Portal Website HMTE',
    image: '/assets/semiconductor_career.png',
    tagline: 'Rumah digital untuk informasi, dokumentasi, dan layanan HMTE.',
    summary:
      'Portal Website HMTE menghubungkan berita, agenda, direktori pengurus, program kerja, dokumentasi, dan kanal aspirasi dalam satu pengalaman digital yang konsisten.',
    focus: ['Arsitektur informasi publik', 'Sistem konten dan administrasi', 'Akses informasi yang responsif'],
    timeline: [
      { date: 'Mei 2026', label: 'Pemetaan', description: 'Audit konten, kebutuhan pengguna, dan struktur halaman.', state: 'done' },
      { date: 'Juni 2026', label: 'Pengembangan', description: 'Pembangunan halaman publik dan dashboard pengelolaan.', state: 'active' },
      { date: 'Juli 2026', label: 'Uji publik', description: 'Pengujian perangkat, aksesibilitas, dan alur informasi.', state: 'upcoming' },
      { date: 'Sepanjang periode', label: 'Pemeliharaan', description: 'Pembaruan konten dan pengembangan fitur lanjutan.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Dokumen Kebutuhan Website', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Panduan Pengelolaan Konten', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Catatan Rilis', format: 'MD', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'IPTEK',
    programName: 'Workshop Embedded & IoT',
    image: '/assets/robotics_prestige.png',
    tagline: 'Belajar teknologi melalui praktik, prototipe, dan kolaborasi.',
    summary:
      'Workshop Embedded & IoT dirancang sebagai rangkaian belajar terapan dari pengenalan perangkat, pemrograman, hingga demonstrasi prototipe sederhana.',
    focus: ['Dasar embedded system', 'Integrasi sensor dan jaringan', 'Prototipe berbasis kebutuhan nyata'],
    timeline: [
      { date: 'Tahap 01', label: 'Kurasi materi', description: 'Penyusunan silabus, perangkat, dan kebutuhan praktikum.', state: 'done' },
      { date: 'Juni 2026', label: 'Workshop dasar', description: 'Pengenalan mikrokontroler, sensor, dan komunikasi data.', state: 'active' },
      { date: 'Tahap 03', label: 'Mini project', description: 'Pengembangan prototipe dalam kelompok kecil.', state: 'upcoming' },
      { date: 'Tahap 04', label: 'Showcase', description: 'Demonstrasi hasil dan evaluasi pembelajaran.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Modul Workshop Embedded & IoT', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Daftar Komponen Praktikum', format: 'XLSX', status: 'Segera tersedia' },
      { name: 'Template Mini Project', format: 'ZIP', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'PSDM',
    programName: 'Kaderisasi & Evaluasi',
    image: '/assets/ugm_socialization.png',
    tagline: 'Menjaga pertumbuhan anggota melalui pendampingan yang terukur.',
    summary:
      'Kaderisasi & Evaluasi menjadi rangkaian pemantauan, mentoring, dan refleksi untuk memastikan proses pengembangan anggota berjalan sehat sepanjang periode.',
    focus: ['Pendampingan anggota', 'Evaluasi perkembangan', 'Penguatan budaya organisasi'],
    timeline: [
      { date: 'Awal periode', label: 'Pemetaan anggota', description: 'Pendataan kebutuhan, minat, dan kondisi awal anggota.', state: 'done' },
      { date: 'Sepanjang periode', label: 'Mentoring', description: 'Pertemuan dan pendampingan melalui kelompok mentor.', state: 'active' },
      { date: 'Tengah periode', label: 'Evaluasi', description: 'Refleksi perkembangan dan penyesuaian dukungan.', state: 'upcoming' },
      { date: 'Akhir periode', label: 'Rekap', description: 'Penyusunan catatan perkembangan dan rekomendasi.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Panduan Mentoring Anggota', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Instrumen Evaluasi', format: 'DOCX', status: 'Segera tersedia' },
      { name: 'Rekap Perkembangan', format: 'XLSX', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'PHAL',
    programName: 'Company Visit',
    image: '/assets/solar_village.png',
    tagline: 'Membawa mahasiswa lebih dekat dengan praktik dan budaya industri.',
    summary:
      'Company Visit membuka ruang belajar langsung mengenai proses kerja, kebutuhan kompetensi, dan peluang kolaborasi dengan mitra teknologi maupun manufaktur.',
    focus: ['Wawasan dunia industri', 'Relasi dengan mitra', 'Eksplorasi karier mahasiswa'],
    timeline: [
      { date: 'Tahap 01', label: 'Kurasi mitra', description: 'Pemetaan perusahaan dan relevansi bidang kerja.', state: 'done' },
      { date: 'Tahap 02', label: 'Koordinasi', description: 'Penyesuaian agenda, peserta, dan kebutuhan kunjungan.', state: 'active' },
      { date: 'Agustus 2026', label: 'Kunjungan', description: 'Pelaksanaan tur fasilitas dan sesi diskusi industri.', state: 'upcoming' },
      { date: 'Pasca kegiatan', label: 'Tindak lanjut', description: 'Dokumentasi hasil dan penjajakan kolaborasi.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Proposal Company Visit', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Panduan Peserta', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Laporan Kegiatan', format: 'PDF', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'MINKAT',
    programName: 'Electro Art Night',
    image: '/assets/robotics_prestige.png',
    tagline: 'Panggung bersama untuk ekspresi, karya, dan keberanian tampil.',
    summary:
      'Electro Art Night mewadahi penampilan musik, seni, dan karya kreatif mahasiswa dalam format malam apresiasi yang terbuka dan kolaboratif.',
    focus: ['Ruang ekspresi mahasiswa', 'Kolaborasi lintas angkatan', 'Apresiasi karya kreatif'],
    timeline: [
      { date: 'Tahap 01', label: 'Open submission', description: 'Pendaftaran penampil dan pengumpulan konsep karya.', state: 'done' },
      { date: 'Tahap 02', label: 'Kurasi', description: 'Penyusunan susunan acara dan kebutuhan produksi.', state: 'active' },
      { date: 'Oktober 2026', label: 'Art night', description: 'Pelaksanaan pertunjukan dan pameran karya.', state: 'upcoming' },
      { date: 'Pasca acara', label: 'Arsip karya', description: 'Publikasi dokumentasi dan katalog karya peserta.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Panduan Penampil', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Rundown Electro Art Night', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Katalog Karya', format: 'PDF', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'KASTRAD',
    programName: 'Electro Speak Up',
    image: '/assets/smart_grid_dashboard.png',
    tagline: 'Aspirasi mahasiswa dicatat, dipetakan, dan ditindaklanjuti.',
    summary:
      'Electro Speak Up menyediakan jalur aspirasi yang terstruktur untuk isu fasilitas, akademik, dan pengalaman mahasiswa, lengkap dengan pemetaan serta pembaruan tindak lanjut.',
    focus: ['Penyerapan aspirasi', 'Pemetaan isu prioritas', 'Transparansi tindak lanjut'],
    timeline: [
      { date: 'Juni 2026', label: 'Kanal dibuka', description: 'Peluncuran formulir dan mekanisme penerimaan aspirasi.', state: 'done' },
      { date: 'Berjalan', label: 'Klasifikasi', description: 'Pengelompokan isu berdasarkan urgensi dan pemangku kepentingan.', state: 'active' },
      { date: 'Berkala', label: 'Advokasi', description: 'Koordinasi tindak lanjut dengan pihak terkait.', state: 'upcoming' },
      { date: 'Akhir periode', label: 'Laporan', description: 'Publikasi rekap isu dan hasil penyelesaian.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Ringkasan Aspirasi', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Matriks Tindak Lanjut', format: 'XLSX', status: 'Segera tersedia' },
      { name: 'Laporan Advokasi', format: 'PDF', status: 'Segera tersedia' },
    ],
  },
  {
    divisionCode: 'KEWIRUS',
    programName: 'Electro Store',
    image: '/assets/solar_village.png',
    tagline: 'Merchandise resmi yang menguatkan identitas dan kemandirian HMTE.',
    summary:
      'Electro Store mengelola pengembangan, produksi, dan distribusi merchandise resmi sebagai layanan anggota sekaligus sumber pendanaan organisasi yang berkelanjutan.',
    focus: ['Produk identitas HMTE', 'Pengelolaan penjualan', 'Pendanaan organisasi mandiri'],
    timeline: [
      { date: 'Tahap 01', label: 'Riset produk', description: 'Pengumpulan kebutuhan dan preferensi mahasiswa.', state: 'done' },
      { date: 'Berjalan', label: 'Produksi', description: 'Finalisasi desain, vendor, dan kontrol kualitas.', state: 'active' },
      { date: 'Sepanjang periode', label: 'Penjualan', description: 'Pembukaan katalog dan distribusi pesanan.', state: 'upcoming' },
      { date: 'Berkala', label: 'Evaluasi', description: 'Rekap penjualan dan pengembangan produk berikutnya.', state: 'upcoming' },
    ],
    documents: [
      { name: 'Katalog Electro Store', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Panduan Pemesanan', format: 'PDF', status: 'Segera tersedia' },
      { name: 'Rekap Produk', format: 'XLSX', status: 'Segera tersedia' },
    ],
  },
] satisfies FeaturedProgramPresentation[]
