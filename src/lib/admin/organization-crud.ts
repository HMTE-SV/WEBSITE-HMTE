import {
  normalizeProgramCoordinators,
  normalizeProgramObjectives,
  normalizeProgramResources,
  normalizeProgramTimeline,
  sanitizeResourceUrl,
  PROGRAM_OBJECTIVE_LIMIT,
  PROGRAM_RESOURCE_LIMIT,
  PROGRAM_TIMELINE_LIMIT,
  type ProgramResource,
  type ProgramTimelineEntry,
} from '@/lib/program-detail'
import {
  buildProgramSchedule,
  getAgendaYear,
  normalizeProgramMonths,
  parseIsoDate,
} from '@/lib/program-schedule'
import type { DivisionCode, ProgramStatus } from '@/types/content'
import type {
  DivisionDocument,
  FirestoreCollectionName,
  LeaderContactDocument,
  LeaderDocument,
  ProgramDocument,
} from '@/types/firestore'

export type OrganizationKind = 'leaders' | 'divisions' | 'programs'

export type OrganizationFormValues = {
  active: boolean
  /** Angkatan pengurus, mis. "2023". Ditampilkan di halaman publik. */
  batch: string
  bio: string
  code: DivisionCode
  /** Nama penanggung jawab, dipilih dari daftar pengurus bidang. */
  coordinators: string[]
  date: string
  desc: string
  description: string
  divisionCode: DivisionCode
  email: string
  endDate: string
  /** Ditandai sorotan di /program-kerja. */
  featured: boolean
  instagram: string
  linkedin: string
  /** Bulan rencana 1-12, sudah terurut dan tanpa duplikat. */
  months: number[]
  name: string
  /**
   * Poin fokus, satu per baris.
   *
   * Disimpan sebagai satu teks, bukan array, karena isiannya memang satu
   * textarea. Menyimpannya sebagai array berarti setiap ketikan huruf harus
   * memecah dan menyusun ulang daftar, dan kursor akan melompat tiap kali
   * pengurus menekan Enter di tengah baris.
   */
  objectives: string
  order: string
  photo: string
  programStatus: ProgramStatus
  resources: ProgramResource[]
  role: string
  shortName: string
  startDate: string
  summary: string
  timeline: ProgramTimelineEntry[]
}

export type ManagedOrganizationDocument = LeaderDocument | DivisionDocument | ProgramDocument

type OrganizationCrudConfig = {
  collectionName: Extract<FirestoreCollectionName, OrganizationKind>
  kind: OrganizationKind
  label: string
}

export const organizationCrudConfigs = {
  leaders: {
    collectionName: 'leaders',
    kind: 'leaders',
    label: 'Pengurus',
  },
  divisions: {
    collectionName: 'divisions',
    kind: 'divisions',
    label: 'Unsur Organisasi',
  },
  programs: {
    collectionName: 'programs',
    kind: 'programs',
    label: 'Program Kerja',
  },
} as const satisfies Record<OrganizationKind, OrganizationCrudConfig>

function parseOrder(value: string) {
  const order = Number.parseInt(value, 10)
  return Number.isFinite(order) ? order : 0
}

/**
 * Mengubah teks bulan ("3, 6, 9, 12") jadi angka terurut tanpa duplikat.
 *
 * Panel tidak lagi memakai ini: isiannya sudah diganti pemilih dua belas kotak
 * sehingga angka di luar 1-12 mustahil masuk. Yang masih membutuhkannya adalah
 * jalur impor, yaitu script seed dan dokumen lama yang menyimpan bulan sebagai
 * teks bebas. Nilai di luar rentang dibuang diam-diam, bukan dijadikan error,
 * karena peta dua belas bulan di /agenda memakai angka ini sebagai indeks kolom
 * dan satu nilai liar merusak gambar seluruh baris.
 */
export function parseProgramMonths(value: string): number[] {
  const parsed = value
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)

  return [...new Set(parsed)].sort((first, second) => first - second)
}

export function formatProgramMonths(months: number[] | undefined): string {
  return (months || []).join(', ')
}

/**
 * Menyalakan atau mematikan satu bulan di pemilih dua belas kotak.
 *
 * Dipisah dari komponen supaya perilakunya bisa dites tanpa merender apa pun,
 * dan supaya hasilnya selalu terurut. Urutan penting: `months` dikirim apa
 * adanya ke Firestore, dan peta tahun membaca elemen pertama sebagai bulan
 * paling awal.
 */
export function toggleProgramMonth(months: number[], month: number): number[] {
  const next = months.includes(month)
    ? months.filter((value) => value !== month)
    : [...months, month]

  return normalizeProgramMonths(next)
}

export function getEmptyOrganizationFormValues(kind: OrganizationKind): OrganizationFormValues {
  return {
    active: true,
    batch: '',
    bio: '',
    code: 'PH',
    coordinators: [],
    date: '',
    desc: '',
    description: '',
    divisionCode: 'PH',
    email: '',
    endDate: '',
    featured: false,
    instagram: '',
    linkedin: '',
    months: [],
    name: '',
    objectives: '',
    order: '0',
    photo: '',
    programStatus: 'Terjadwal',
    resources: [],
    role: '',
    shortName: kind === 'divisions' ? 'PH' : '',
    startDate: '',
    summary: '',
    timeline: [],
  }
}

/** Textarea "satu poin per baris" jadi array, baris kosong dibuang. */
export function parseObjectiveLines(value: string): string[] {
  return normalizeProgramObjectives(value.split('\n'))
}

export function formatObjectiveLines(objectives: string[] | undefined): string {
  return (objectives || []).join('\n')
}

export function emptyTimelineEntry(): ProgramTimelineEntry {
  return { label: '', when: '', detail: '' }
}

export function emptyProgramResource(): ProgramResource {
  return { label: '', url: '', note: '' }
}

/**
 * Mengubah satu kolom pada satu baris daftar berulang.
 *
 * Ada di sini, bukan sebagai closure di dalam komponen, supaya bisa dites
 * tanpa merender apa pun: baris berulang adalah tempat paling gampang menulis
 * mutasi yang mengubah array aslinya, dan React tidak akan menggambar ulang
 * kalau acuannya sama.
 */
export function updateListRow<Row>(rows: Row[], index: number, patch: Partial<Row>): Row[] {
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
}

export function removeListRow<Row>(rows: Row[], index: number): Row[] {
  return rows.filter((_, rowIndex) => rowIndex !== index)
}

/** Menyalakan atau mematikan satu nama penanggung jawab. */
export function toggleCoordinator(coordinators: string[], name: string): string[] {
  const trimmed = name.trim()

  if (!trimmed) {
    return coordinators
  }

  const key = trimmed.toLocaleLowerCase('id-ID')
  const without = coordinators.filter((entry) => entry.trim().toLocaleLowerCase('id-ID') !== key)

  return without.length === coordinators.length ? [...coordinators, trimmed] : without
}

export type OrganizationValidationResult = {
  errors: string[]
  warnings: string[]
}

/**
 * Memeriksa isian sebelum menyentuh Firestore.
 *
 * Dibagi dua tingkat dengan sengaja. `errors` menghentikan penyimpanan karena
 * datanya mustahil digambar: rentang yang berakhir sebelum ia mulai bukan
 * rentang mundur, itu salah ketik, dan `buildProgramSchedule` akan diam-diam
 * memperlakukannya sebagai kegiatan sehari. `warnings` tetap membiarkan simpan
 * jalan karena kasusnya sah: kepengurusan bisa punya kegiatan yang jatuh di luar
 * tahun papan, dan program tanpa jadwal sama sekali memang ada di Buku Panduan.
 * Menolak keduanya akan memaksa pengurus mengarang tanggal, dan tanggal karangan
 * lebih buruk daripada kolom kosong yang jujur.
 */
export function validateOrganizationValues(
  kind: OrganizationKind,
  values: OrganizationFormValues,
): OrganizationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!values.name.trim()) {
    errors.push('Nama wajib diisi.')
  }

  if (kind !== 'programs') {
    return { errors, warnings }
  }

  const startText = values.startDate.trim()
  const endText = values.endDate.trim()
  const start = parseIsoDate(startText)
  const end = parseIsoDate(endText)

  if (startText && !start) {
    errors.push('Tanggal mulai tidak valid. Pakai format YYYY-MM-DD.')
  }

  if (endText && !end) {
    errors.push('Tanggal selesai tidak valid. Pakai format YYYY-MM-DD.')
  }

  if (endText && !startText) {
    errors.push('Tanggal selesai butuh tanggal mulai. Kegiatan sehari cukup isi tanggal mulai saja.')
  }

  if (start && end && end.getTime() < start.getTime()) {
    errors.push('Tanggal selesai lebih awal daripada tanggal mulai.')
  }

  const agendaYear = getAgendaYear()

  if (start && start.getUTCFullYear() !== agendaYear) {
    warnings.push(
      `Tanggal mulai jatuh di ${start.getUTCFullYear()}, di luar tahun papan ${agendaYear}. Program tetap tersimpan, tapi tidak akan digambar di /agenda.`,
    )
  }

  if (!start && values.months.length === 0) {
    warnings.push('Tanpa bulan atau tanggal, program ini terbit di /program-kerja tapi tidak muncul di peta /agenda.')
  }

  validateProgramDetail(values, errors, warnings)

  return { errors, warnings }
}

/**
 * Memeriksa isi halaman rincian: poin fokus, tahapan, dan berkas.
 *
 * Semua baris di sini ditulis tangan lewat panel dan dirender langsung di
 * halaman publik, jadi yang ditolak bukan hanya isian yang salah bentuk,
 * melainkan juga isian yang akan hilang tanpa jejak. Baris tahapan tanpa judul
 * dan berkas tanpa alamat memang dibuang oleh normalizer di
 * src/lib/program-detail.ts. Kalau panel tidak mengatakannya, pengurus mengetik
 * lima tahapan, menekan simpan, melihat pesan berhasil, lalu menemukan tiga di
 * halaman publik tanpa satu pun keterangan mengapa.
 */
function validateProgramDetail(
  values: OrganizationFormValues,
  errors: string[],
  warnings: string[],
) {
  const objectives = parseObjectiveLines(values.objectives)

  if (values.objectives.split('\n').filter((line) => line.trim()).length > PROGRAM_OBJECTIVE_LIMIT) {
    errors.push(`Poin fokus maksimal ${PROGRAM_OBJECTIVE_LIMIT} baris.`)
  }

  if (values.timeline.length > PROGRAM_TIMELINE_LIMIT) {
    errors.push(`Tahapan maksimal ${PROGRAM_TIMELINE_LIMIT} baris.`)
  }

  if (values.resources.length > PROGRAM_RESOURCE_LIMIT) {
    errors.push(`Berkas maksimal ${PROGRAM_RESOURCE_LIMIT} baris.`)
  }

  values.timeline.forEach((entry, index) => {
    const hasSupport = Boolean(entry.when.trim() || entry.detail.trim())

    if (!entry.label.trim() && hasSupport) {
      errors.push(`Tahapan baris ${index + 1} belum punya judul, jadi tidak akan tersimpan.`)
    }
  })

  values.resources.forEach((entry, index) => {
    const url = entry.url.trim()

    if (!url) {
      if (entry.label.trim() || entry.note.trim()) {
        errors.push(`Berkas baris ${index + 1} belum punya alamat, jadi tidak akan tersimpan.`)
      }
      return
    }

    if (!sanitizeResourceUrl(url)) {
      errors.push(
        `Alamat berkas baris ${index + 1} tidak bisa dipakai. Gunakan alamat http:// atau https://, atau alamat halaman situs ini yang diawali garis miring.`,
      )
    }
  })

  if (values.featured && !values.summary.trim() && objectives.length === 0) {
    warnings.push(
      'Program sorotan tampil paling besar di /program-kerja, tapi ringkasan dan poin fokusnya masih kosong.',
    )
  }
}

/**
 * Label bulan yang dibaca manusia, mis. "12-14 Maret 2026".
 *
 * Dulu diketik manual dan sering tidak sinkron dengan `months`. Sekarang
 * diturunkan dari jadwal, dan isian manualnya hanya dipakai kalau pengurus
 * benar-benar menuliskan sesuatu di sana.
 */
function resolveProgramDateLabel(values: OrganizationFormValues, months: number[]): string {
  const manual = values.date.trim()

  if (manual) {
    return manual
  }

  return buildProgramSchedule({
    status: values.programStatus,
    date: '',
    months,
    startDate: values.startDate.trim(),
    endDate: values.endDate.trim(),
  }).label
}

type OrganizationPayload<Kind extends OrganizationKind> = Omit<
  Kind extends 'leaders' ? LeaderDocument : Kind extends 'divisions' ? DivisionDocument : ProgramDocument,
  'id' | 'createdAt' | 'updatedAt'
>

/*
 * Ditulis sebagai overload, bukan satu tanda tangan yang mengembalikan union.
 * Dengan union, pemanggil yang sudah tahu kind-nya 'programs' tetap harus
 * memaksa tipe untuk membaca `startDate`, dan pemaksaan tipe di jalur simpan
 * adalah tempat paling buruk untuk kehilangan pemeriksaan kompilator.
 */
export function buildOrganizationPayload<Kind extends OrganizationKind>(
  kind: Kind,
  values: OrganizationFormValues,
): OrganizationPayload<Kind>
export function buildOrganizationPayload(kind: OrganizationKind, values: OrganizationFormValues) {
  const basePayload = {
    active: values.active,
    order: parseOrder(values.order),
  }

  if (kind === 'leaders') {
    // `email` sengaja tidak ada di sini. Dokumen `leaders` terbaca publik, jadi
    // kontak pribadi disimpan terpisah lewat buildLeaderContactPayload().
    return {
      ...basePayload,
      // Disimpan sebagai string kosong, bukan dihilangkan, dengan alasan yang
      // sama seperti tanggal program: kunci yang hilang pada update berarti
      // "jangan diubah", jadi angkatan yang salah ketik jadi mustahil dikosongkan.
      batch: values.batch.trim(),
      bio: values.bio.trim(),
      divisionCode: values.divisionCode,
      instagram: values.instagram.trim(),
      linkedin: values.linkedin.trim(),
      name: values.name.trim(),
      photo: values.photo.trim(),
      role: values.role.trim(),
    } satisfies Omit<LeaderDocument, 'id' | 'createdAt' | 'updatedAt'>
  }

  if (kind === 'divisions') {
    return {
      ...basePayload,
      code: values.code,
      description: values.description.trim(),
      name: values.name.trim(),
      shortName: values.shortName.trim(),
    } satisfies Omit<DivisionDocument, 'id' | 'createdAt' | 'updatedAt'>
  }

  const startDate = values.startDate.trim()
  const endDate = values.endDate.trim()
  const start = parseIsoDate(startDate)

  // Tanggal pasti selalu menang atas bulan rencana. Kalau bulannya belum
  // dicentang, tambahkan sendiri, supaya penghitung per bulan di peta tahun
  // tidak melewatkan program yang justru paling pasti jadwalnya.
  const months = start
    ? normalizeProgramMonths([...values.months, start.getUTCMonth() + 1])
    : normalizeProgramMonths(values.months)

  return {
    ...basePayload,
    /*
     * Daftar di bawah selalu ditulis, bahkan saat kosong, dan dinormalkan di
     * sini alih-alih dipercaya apa adanya. Dua alasan yang berbeda:
     *
     * Selalu ditulis, karena `update` Firestore memperlakukan kunci yang hilang
     * sebagai "jangan diubah". Menghilangkan `timeline` saat pengurus menghapus
     * baris terakhirnya berarti tahapan lama bertahan di dokumen selamanya.
     *
     * Dinormalkan, karena baris kosong yang belum diisi pengurus tidak boleh
     * ikut tersimpan. Tanpa ini, satu klik "Tambah tahapan" yang batal diisi
     * akan menitipkan objek kosong ke Firestore dan halaman publik menggambar
     * kotak tanpa isi.
     */
    coordinators: normalizeProgramCoordinators(values.coordinators),
    date: resolveProgramDateLabel(values, months),
    desc: values.desc.trim(),
    divisionCode: values.divisionCode,
    featured: values.featured,
    objectives: parseObjectiveLines(values.objectives),
    resources: normalizeProgramResources(values.resources),
    summary: values.summary.trim(),
    timeline: normalizeProgramTimeline(values.timeline),
    // Disimpan sebagai string kosong, bukan dihilangkan. Menghapus kunci pada
    // update berarti "jangan diubah", jadi pengurus tidak akan pernah bisa
    // mengosongkan tanggal yang batal. parseIsoDate('') tetap undefined, jadi
    // seluruh lapisan di bawah membacanya sebagai belum terjadwal.
    endDate,
    months,
    name: values.name.trim(),
    startDate,
    status: values.programStatus,
  } satisfies Omit<ProgramDocument, 'id' | 'createdAt' | 'updatedAt'>
}

export function buildLeaderContactPayload(values: OrganizationFormValues) {
  return {
    divisionCode: values.divisionCode,
    email: values.email.trim(),
  } satisfies Omit<LeaderContactDocument, 'id' | 'createdAt' | 'updatedAt'>
}

export function organizationDocumentToFormValues(
  kind: OrganizationKind,
  document: ManagedOrganizationDocument,
  /** Diambil dari `leaderContacts`, bukan dari dokumen pengurus. */
  contactEmail = '',
): OrganizationFormValues {
  const values = getEmptyOrganizationFormValues(kind)

  if (kind === 'leaders') {
    const leader = document as LeaderDocument
    return {
      ...values,
      active: leader.active,
      batch: leader.batch || '',
      bio: leader.bio || '',
      divisionCode: leader.divisionCode || 'PH',
      email: contactEmail,
      instagram: leader.instagram || '',
      linkedin: leader.linkedin || '',
      name: leader.name,
      order: String(leader.order),
      photo: leader.photo,
      role: leader.role,
    }
  }

  if (kind === 'divisions') {
    const division = document as DivisionDocument
    return {
      ...values,
      active: division.active,
      code: division.code,
      description: division.description,
      name: division.name,
      order: String(division.order),
      shortName: division.shortName,
    }
  }

  const program = document as ProgramDocument
  return {
    ...values,
    active: program.active,
    coordinators: normalizeProgramCoordinators(program.coordinators),
    date: program.date,
    desc: program.desc,
    divisionCode: program.divisionCode,
    endDate: program.endDate || '',
    featured: program.featured === true,
    months: normalizeProgramMonths(program.months),
    name: program.name,
    objectives: formatObjectiveLines(normalizeProgramObjectives(program.objectives)),
    order: String(program.order),
    programStatus: program.status,
    resources: normalizeProgramResources(program.resources),
    startDate: program.startDate || '',
    summary: program.summary || '',
    timeline: normalizeProgramTimeline(program.timeline),
  }
}
