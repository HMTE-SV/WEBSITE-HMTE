/*
 * Isi rincian program kerja: ringkasan, poin fokus, tahapan, berkas, dan
 * penanggung jawab.
 *
 * Sebelum berkas ini ada, ketiganya hidup sebagai konstanta di
 * src/data/program-presentations.ts dan hanya dimiliki tiga program unggulan.
 * Artinya 34 program lain mustahil punya halaman rincian yang berisi, dan
 * pengurus tidak punya satu pun cara menambahkannya tanpa mengubah repo.
 *
 * Sama seperti src/lib/program-schedule.ts, berkas ini WAJIB murni: tidak boleh
 * mengimpor Firebase, tidak boleh menyentuh jaringan. Panel admin dan komponen
 * publik sama-sama memakainya di browser, dan satu import Firebase di sini akan
 * menarik seluruh SDK ke bundle klien.
 *
 * Semua yang masuk lewat sini datang dari isian manusia lewat panel, jadi
 * pembacanya harus menganggap bentuknya belum tentu benar: dokumen yang ditulis
 * sebelum field ini ada mengembalikan undefined, dan dokumen yang ditulis versi
 * panel berikutnya bisa membawa bentuk yang tidak kita duga.
 */

/** Satu tahapan pelaksanaan. `when` sengaja teks bebas, bukan tanggal mesin. */
export type ProgramTimelineEntry = {
  label: string
  /** Mis. "April", "Pekan pertama Oktober", "H-7". Tidak diurai jadi Date. */
  when: string
  detail: string
}

/** Satu berkas atau tautan resmi milik program. */
export type ProgramResource = {
  label: string
  url: string
  note: string
}

/*
 * Batas jumlah entri.
 *
 * Bukan aturan redaksi, melainkan pagar render: array ini digambar apa adanya
 * di halaman publik, dan satu dokumen yang rusak atau diisi berlebihan tidak
 * boleh bisa menggantung halaman. Angkanya jauh di atas kebutuhan nyata
 * (program terpanjang di Buku Panduan punya empat tahapan), jadi pemotongan ini
 * praktis tidak akan pernah terjadi pada data yang sah.
 */
export const PROGRAM_OBJECTIVE_LIMIT = 12
export const PROGRAM_TIMELINE_LIMIT = 24
export const PROGRAM_RESOURCE_LIMIT = 12
export const PROGRAM_COORDINATOR_LIMIT = 12

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value.trim() : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Daftar teks pendek: poin fokus dan nama penanggung jawab. */
function normalizeTextList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const result: string[] = []

  for (const entry of value) {
    if (typeof entry !== 'string') continue

    const text = entry.trim()
    if (!text) continue

    // Kunci pembanding dinormalkan supaya "Ketua Pelaksana" dan "ketua
    // pelaksana" tidak tampil sebagai dua baris; yang disimpan tetap tulisan
    // asli pengurus.
    const key = text.toLocaleLowerCase('id-ID')
    if (seen.has(key)) continue

    seen.add(key)
    result.push(text)

    if (result.length >= limit) break
  }

  return result
}

export function normalizeProgramObjectives(value: unknown): string[] {
  return normalizeTextList(value, PROGRAM_OBJECTIVE_LIMIT)
}

export function normalizeProgramCoordinators(value: unknown): string[] {
  return normalizeTextList(value, PROGRAM_COORDINATOR_LIMIT)
}

/**
 * Tahapan tanpa `label` dibuang, bukan diberi label kosong.
 *
 * Baris tanpa judul tidak bisa dibaca sebagai tahapan apa pun, dan
 * membiarkannya lewat berarti halaman publik menggambar kotak kosong yang
 * terlihat seperti kerusakan tampilan.
 */
export function normalizeProgramTimeline(value: unknown): ProgramTimelineEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: ProgramTimelineEntry[] = []

  for (const entry of value) {
    if (!isRecord(entry)) continue

    const label = readString(entry, 'label')
    if (!label) continue

    result.push({
      label,
      when: readString(entry, 'when'),
      detail: readString(entry, 'detail'),
    })

    if (result.length >= PROGRAM_TIMELINE_LIMIT) break
  }

  return result
}

/**
 * Menyaring alamat berkas yang aman dirender sebagai tautan.
 *
 * Ini pemeriksaan keamanan, bukan kerapian. Alamat di sini diketik pengurus
 * lewat panel lalu dipasang langsung ke `href` di halaman publik, jadi tanpa
 * penyaringan sebuah `javascript:` cukup untuk menjalankan skrip di peramban
 * setiap pengunjung yang mengekliknya. Daftar putih dipakai, bukan daftar
 * hitam: skema yang tidak dikenal ditolak, jadi `data:` dan kawan-kawannya
 * gugur tanpa perlu disebut satu per satu.
 *
 * Alamat relatif hanya diterima kalau diawali satu garis miring. `//host` itu
 * alamat protokol-relatif menuju domain lain, bukan halaman situs ini.
 */
export function sanitizeResourceUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  const url = value.trim()
  if (!url) return ''

  if (url.startsWith('/')) {
    return url.startsWith('//') ? '' : url
  }

  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? url : ''
  } catch {
    return ''
  }
}

/**
 * Berkas tanpa alamat yang sah dibuang seluruhnya.
 *
 * Alternatifnya, menampilkan namanya sebagai teks mati, justru lebih buruk:
 * pengunjung melihat "Proposal kegiatan" di bawah judul Berkas lalu menemukan
 * bahwa ia tidak bisa diklik, dan tidak ada cara membedakannya dari tautan yang
 * rusak. Panel yang menolak menyimpan alamat tidak sah adalah tempat yang benar
 * untuk memberi tahu, bukan halaman publiknya.
 */
export function normalizeProgramResources(value: unknown): ProgramResource[] {
  if (!Array.isArray(value)) {
    return []
  }

  const result: ProgramResource[] = []

  for (const entry of value) {
    if (!isRecord(entry)) continue

    const url = sanitizeResourceUrl(entry.url)
    if (!url) continue

    const label = readString(entry, 'label')

    result.push({
      // Berkas tanpa nama tetap layak tampil; yang tidak ada cuma judulnya.
      label: label || 'Berkas program',
      url,
      note: readString(entry, 'note'),
    })

    if (result.length >= PROGRAM_RESOURCE_LIMIT) break
  }

  return result
}

/** Tautan luar dibuka di tab baru; tautan situs sendiri tidak. */
export function isExternalResource(url: string): boolean {
  return !url.startsWith('/')
}
