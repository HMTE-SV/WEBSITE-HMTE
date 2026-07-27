import { agendaYear as localAgendaYear } from '@/data/site-content'

/*
 * Identitas kepengurusan yang berulang di seluruh situs.
 *
 * Semua nilai di bawah ini dulu ditulis langsung di src/data/site-content.ts,
 * dan semuanya berganti bersamaan tepat sekali setahun ketika kabinet berganti.
 * Artinya pergantian kepengurusan menuntut sunting kode dan deploy ulang, untuk
 * mengubah beberapa potong teks. Itu yang dibereskan halaman /admin/settings.
 *
 * Berkas ini sengaja murni: tidak mengimpor Firebase, tidak menyentuh jaringan.
 * Bentuk dan pembersihan datanya bisa diuji tanpa emulator, dan `program-schedule`
 * tetap boleh mengimpornya tanpa menarik SDK apa pun.
 */

export type SiteSettings = {
  /** Nama kabinet tanpa kata "Kabinet", mis. "Abya Vistara". */
  cabinetName: string
  /** Label periode seperti yang dibaca manusia, mis. "2026/2027". */
  periodLabel: string
  /** Tahun yang digambar papan /agenda. */
  agendaYear: number
  tagline: string
  instagram: string
  email: string
  address: string
  /** Semboyan di kaki halaman. */
  closingCheer: string
}

/**
 * Dipakai ketika Firestore belum punya dokumen `settings/site`, atau ketika
 * pembacaannya gagal. Nilainya sama persis dengan yang dulu ada di kode, jadi
 * situs yang belum pernah menyentuh halaman pengaturan tampil tidak berubah.
 */
export const defaultSiteSettings: SiteSettings = {
  address: 'Program Studi Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  agendaYear: localAgendaYear,
  cabinetName: 'Abya Vistara',
  closingCheer: 'ELEKTRO... SATU!!!',
  email: 'hmte.svugm@gmail.com',
  instagram: 'hmteugm',
  periodLabel: '2026/2027',
  tagline:
    'Rumah bertumbuh yang nyaman, inovatif, dan produktif untuk berkembang bersama serta memberi dampak lebih luas.',
}

function pickText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

/**
 * Membuang '@' dan URL lengkap dari nama akun Instagram.
 *
 * Pengurus akan menempelkan salah satu dari tiga bentuk itu, dan situs
 * membangun sendiri tautan maupun label dari nama akunnya. Menyimpan bentuk
 * campur aduk menghasilkan tautan seperti instagram.com/@hmteugm yang mati.
 */
export function normalizeInstagramHandle(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
}

/**
 * Membentuk SiteSettings yang utuh dari dokumen Firestore apa adanya.
 *
 * Setiap field jatuh ke nilai bawaan satu per satu, bukan seluruh objek
 * sekaligus. Dokumen yang cuma diisi separuh adalah keadaan normal: pengurus
 * menyimpan nama kabinet lebih dulu dan mengisi sisanya nanti, dan itu tidak
 * boleh mengosongkan kaki halaman.
 */
export function normalizeSiteSettings(raw: Record<string, unknown> | null | undefined): SiteSettings {
  if (!raw) {
    return defaultSiteSettings
  }

  const year = Number(raw.agendaYear)

  return {
    address: pickText(raw.address, defaultSiteSettings.address),
    // Tahun di luar rentang yang masuk akal ditolak, bukan dipakai. Papan
    // /agenda memakai angka ini sebagai sumbu; satu nilai liar seperti 0 atau
    // 202600 membuat seluruh program terbaca "di luar tahun papan" sekaligus.
    agendaYear: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : defaultSiteSettings.agendaYear,
    cabinetName: pickText(raw.cabinetName, defaultSiteSettings.cabinetName),
    closingCheer: pickText(raw.closingCheer, defaultSiteSettings.closingCheer),
    email: pickText(raw.email, defaultSiteSettings.email),
    instagram: normalizeInstagramHandle(pickText(raw.instagram, defaultSiteSettings.instagram)),
    periodLabel: pickText(raw.periodLabel, defaultSiteSettings.periodLabel),
    tagline: pickText(raw.tagline, defaultSiteSettings.tagline),
  }
}

/** "Kabinet Abya Vistara". Dipakai di kaki halaman, /kepengurusan, dan hero. */
export function formatCabinetTitle(settings: SiteSettings) {
  return `Kabinet ${settings.cabinetName}`
}

/** "Periode 2026/2027". */
export function formatPeriodTitle(settings: SiteSettings) {
  return `Periode ${settings.periodLabel}`
}

export function instagramUrl(settings: SiteSettings) {
  return `https://www.instagram.com/${settings.instagram}`
}

export function instagramLabel(settings: SiteSettings) {
  return `@${settings.instagram}`
}
