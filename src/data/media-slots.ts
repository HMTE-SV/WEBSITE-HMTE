export type MediaSlotDefinition = {
  key: string
  label: string
  group: 'Brand' | 'Beranda' | 'Kontak' | 'Organisasi' | 'SEO'
  description: string
  fallbackUrl: string
  fallbackAlt: string
}

/**
 * Slot adalah kontrak antara panel dan komponen publik.
 *
 * Fallback mempertahankan tampilan hari ini sampai fase berikutnya mulai
 * membaca `mediaSlots` di halaman publik. Key tidak boleh diubah setelah
 * dipakai: label boleh berganti, key adalah identitas datanya.
 */
export const mediaSlotDefinitions = [
  {
    key: 'brand.logo.primary',
    label: 'Logo utama HMTE',
    group: 'Brand',
    description: 'Dipakai header, footer, dan identitas utama situs.',
    fallbackUrl: '/assets/logo-hmte.svg',
    fallbackAlt: 'Logo HMTE TRE SV UGM',
  },
  {
    key: 'brand.favicon',
    label: 'Favicon HMTE',
    group: 'Brand',
    description: 'Ikon tab browser dan identitas penerbit.',
    fallbackUrl: '/assets/favicon.svg',
    fallbackAlt: 'Ikon HMTE TRE SV UGM',
  },
  {
    key: 'cabinet.logo',
    label: 'Logo kabinet aktif',
    group: 'Brand',
    description: 'Entry beranda, footer, kepengurusan, dan fallback profil.',
    fallbackUrl: '/assets/abya-vistara/logo-kabinet.webp',
    fallbackAlt: 'Logo kabinet HMTE',
  },
  ...[
    'kegiatan-01.webp',
    'kegiatan-02.webp',
    'kegiatan-03.webp',
    'kabinet-01.webp',
    'kabinet-02.webp',
    'kabinet-03.webp',
  ].map((file, index) => ({
    key: `home.hero.${index + 1}`,
    label: `Hero beranda ${index + 1}`,
    group: 'Beranda' as const,
    description: 'Foto pada pembuka scroll dan dinding hero beranda.',
    fallbackUrl: `/assets/abya-vistara/${file}`,
    fallbackAlt: [
      'Anggota HMTE berinteraksi dalam kegiatan kebersamaan',
      'Barisan anggota HMTE mengikuti permainan kelompok',
      'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
      'Foto Kabinet Abya Vistara di halaman kampus UGM',
      'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan',
      'Foto bersama pengurus HMTE periode 2026/2027',
    ][index],
  })),
  ...[
    'kegiatan-01.webp',
    'kabinet-01.webp',
    'kegiatan-02.webp',
    'kabinet-02.webp',
    'kegiatan-03.webp',
  ].map((file, index) => ({
    key: `home.about.${index + 1}`,
    label: `Tentang HMTE ${index + 1}`,
    group: 'Beranda' as const,
    description: 'Foto yang bergerak di bab Tentang HMTE.',
    fallbackUrl: `/assets/abya-vistara/${file}`,
    fallbackAlt: [
      'Anggota HMTE berinteraksi dalam kegiatan kebersamaan',
      'Foto Kabinet Abya Vistara di halaman kampus UGM',
      'Barisan anggota HMTE mengikuti permainan kelompok',
      'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan',
      'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
    ][index],
  })),
  ...[
    'kegiatan-01.webp',
    'kabinet-01.webp',
    'kegiatan-02.webp',
    'kegiatan-03.webp',
    'kabinet-02.webp',
    'kabinet-03.webp',
  ].map((file, index) => ({
    key: `home.moment.${index + 1}`,
    label: `Dokumentasi beranda ${index + 1}`,
    group: 'Beranda' as const,
    description: 'Foto pada dinding dokumentasi beranda.',
    fallbackUrl: `/assets/abya-vistara/${file}`,
    fallbackAlt: [
      'Anggota HMTE berinteraksi dalam kegiatan kebersamaan',
      'Foto Kabinet Abya Vistara di halaman kampus UGM',
      'Barisan anggota HMTE mengikuti permainan kelompok',
      'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
      'Jajaran Kabinet Abya Vistara mengenakan jaket himpunan',
      'Foto bersama pengurus HMTE periode 2026/2027',
    ][index],
  })),
  {
    key: 'contact.featured',
    label: 'Foto utama kontak',
    group: 'Kontak',
    description: 'Foto pada kartu kanal Instagram di halaman kontak.',
    fallbackUrl: '/assets/abya-vistara/kegiatan-03.webp',
    fallbackAlt: 'Anggota HMTE tertawa bersama dalam kegiatan luar ruang',
  },
  ...([
    ['PH', 'kabinet-01.webp'],
    ['PSDM', 'kegiatan-02.webp'],
    ['PHAL', 'kabinet-02.webp'],
    ['MINKAT', 'kegiatan-03.webp'],
    ['KOMINFO', 'kabinet-03.webp'],
    ['IPTEK', 'kegiatan-01.webp'],
    ['KEWIRUS', 'kegiatan-02.webp'],
    ['KASTRAD', 'kabinet-02.webp'],
  ] as const).map(([code, file]) => ({
    key: `division.${code.toLowerCase()}.hero`,
    label: `Hero divisi ${code}`,
    group: 'Organisasi' as const,
    description: `Latar hero dan kartu visual ${code}.`,
    fallbackUrl: `/assets/abya-vistara/${file}`,
    fallbackAlt: `Dokumentasi visual ${code}`,
  })),
  {
    key: 'seo.default-og',
    label: 'Gambar Open Graph default',
    group: 'SEO',
    description: 'Pratinjau tautan ketika halaman tidak mempunyai gambar khusus.',
    fallbackUrl: '',
    fallbackAlt: 'HMTE TRE SV UGM',
  },
] satisfies MediaSlotDefinition[]

export function getDivisionMediaSlotKey(code: string) {
  return `division.${code.toLowerCase()}.hero`
}
