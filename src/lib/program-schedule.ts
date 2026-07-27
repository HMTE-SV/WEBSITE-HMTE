import { agendaYear } from '@/data/site-content'
import type { Program } from '@/types/content'

/*
 * Aritmetika jadwal program, dipakai bersama oleh /agenda dan /program-kerja.
 *
 * Alasan berkas ini ada: papan tahun sempat menggambar program yang direncanakan
 * "Januari" sebagai blok pejal selebar kolom Januari, dan itu terbaca sebagai
 * "berlangsung 1 sampai 31 Januari". Sumbernya (Buku Panduan) tidak pernah
 * menyatakan itu. Yang dimilikinya hanya bulan rencana.
 *
 * Maka jadwal dipecah jadi tiga tingkat kepastian, dan tampilannya membedakan
 * ketiganya:
 *
 *   exact       tanggal pasti, diisi pengurus lewat panel  -> angka hari
 *   planned     hanya bulan rencana dari buku panduan      -> nama bulan, redup
 *   unscheduled tidak punya keduanya                       -> "belum"
 *
 * Kalkulasi tanggal memakai Date.UTC agar tahun kabisat benar dengan sendirinya
 * dan tidak ada pergeseran satu hari saat server berjalan di zona waktu lain.
 */

export type SchedulePrecision = 'exact' | 'planned' | 'unscheduled'

export type ScheduleBand = {
  /** Fraksi tahun 0..1, tepi kiri. */
  from: number
  /** Fraksi tahun 0..1, tepi kanan. */
  to: number
  /** Bulan 1-12 tempat band ini dimulai. */
  month: number
}

export type ProgramSchedule = {
  precision: SchedulePrecision
  /** status === 'Berkala'. Pola pelaksanaan, terpisah dari tingkat kepastian. */
  isRecurring: boolean
  months: number[]
  bands: ScheduleBand[]
  startDate?: Date
  endDate?: Date
  /** Jumlah hari inklusif; 1 untuk kegiatan sehari. Hanya untuk `exact`. */
  dayCount?: number
  label: string
}

export const MONTH_NAMES_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const

/**
 * Membersihkan `months` yang datang dari Firestore atau dari isian panel.
 *
 * Dipisah jadi fungsi sendiri karena peta tahun memakai angka ini untuk
 * menghitung isi tiap bulan: satu nilai 0, 13, atau duplikat sudah cukup untuk
 * membuat hitungannya salah. Dokumen lama yang dibuat sebelum field ini ada juga masuk ke
 * sini sebagai `undefined`, dan itu ditangani sebagai daftar kosong. Program
 * tetap tampil di /program-kerja, hanya tidak punya tanda di papan bulan.
 *
 * Tinggal di sini, bukan di organization-data.ts, supaya berkas ini tetap murni
 * dan bisa di-import komponen klien tanpa ikut menarik Firebase SDK ke bundle.
 */
export function normalizeProgramMonths(months: unknown): number[] {
  if (!Array.isArray(months)) {
    return []
  }

  const valid = months.filter(
    (month): month is number =>
      typeof month === 'number' && Number.isInteger(month) && month >= 1 && month <= 12,
  )

  return [...new Set(valid)].sort((first, second) => first - second)
}

/**
 * Tahun yang digambar papan agenda.
 *
 * Wajib eksplisit, bukan `new Date().getFullYear()`. Papan harus menggambar
 * tahun periode kepengurusan, dan penanda bulan berjalan harus tahu apakah hari
 * ini memang jatuh di tahun itu. Kalau tahunnya ikut jam sistem, papan diam-diam
 * berubah tiap 1 Januari tanpa ada yang memutuskannya.
 */
export function getAgendaYear(): number {
  return agendaYear
}

/**
 * Mengurai 'YYYY-MM-DD' jadi Date UTC, atau undefined kalau bukan tanggal sah.
 *
 * Pemeriksaan balik terhadap komponen tanggal penting: `Date.UTC` diam-diam
 * menggulung 2026-02-30 jadi 2 Maret, dan tanggal yang menggulung sendiri lebih
 * berbahaya daripada tanggal yang ditolak. Ini sekaligus yang membuat 29
 * Februari diterima di tahun kabisat dan ditolak di tahun biasa.
 */
export function parseIsoDate(value: string | undefined | null): Date | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  const rolled =
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day

  return rolled ? undefined : date
}

/** Posisi sebuah tanggal sebagai fraksi tahun 0..1. */
export function yearFraction(date: Date, year: number): number {
  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)

  return (date.getTime() - start) / (end - start)
}

/** Band selebar satu bulan penuh. */
export function monthBand(month: number, year: number): ScheduleBand {
  return {
    from: yearFraction(new Date(Date.UTC(year, month - 1, 1)), year),
    to: yearFraction(new Date(Date.UTC(year, month, 1)), year),
    month,
  }
}

/**
 * Menggabungkan bulan yang berurutan jadi satu band.
 *
 * "September sampai November" harus jadi satu arsir memanjang, bukan tiga
 * potongan bersebelahan dengan celah tipis di antaranya. Bulan yang tidak
 * berurutan (mis. 3, 6, 9, 12) tetap jadi band terpisah, karena memang begitu
 * kejadiannya.
 */
export function monthBands(months: number[], year: number): ScheduleBand[] {
  const sorted = normalizeProgramMonths(months)
  const bands: ScheduleBand[] = []
  let previousMonth = 0

  sorted.forEach((month) => {
    const current = bands[bands.length - 1]

    if (current && month === previousMonth + 1) {
      current.to = monthBand(month, year).to
    } else {
      bands.push(monthBand(month, year))
    }

    previousMonth = month
  })

  return bands
}

export function buildProgramSchedule(
  program: Pick<Program, 'status' | 'date' | 'months' | 'startDate' | 'endDate'>,
  year: number = getAgendaYear(),
): ProgramSchedule {
  const isRecurring = program.status === 'Berkala'
  const months = normalizeProgramMonths(program.months)

  const startDate = parseIsoDate(program.startDate)
  // Tanggal di tahun lain tidak bisa ditempatkan di papan tahun ini. Turunkan
  // ke rencana bulanan daripada menampilkan tanggal yang di luar jangkauan.
  const usableStart = startDate && startDate.getUTCFullYear() === year ? startDate : undefined

  if (!usableStart) {
    return buildPlannedSchedule(months, isRecurring, year)
  }

  const rawEnd = parseIsoDate(program.endDate)
  // endDate yang lebih awal dari startDate itu salah isi, bukan rentang mundur.
  // Perlakukan sebagai kegiatan sehari daripada menghasilkan durasi negatif.
  const usableEnd = rawEnd && rawEnd.getTime() >= usableStart.getTime() ? rawEnd : undefined
  const lastDay = usableEnd ?? usableStart

  const dayMs = 24 * 60 * 60 * 1000
  const dayCount = Math.round((lastDay.getTime() - usableStart.getTime()) / dayMs) + 1

  // Tepi kanan memakai hari berikutnya supaya kegiatan sehari punya rentang
  // satu hari, bukan nol.
  const exclusiveEnd = new Date(lastDay.getTime() + dayMs)
  const startMonth = usableStart.getUTCMonth() + 1

  // Tanggal pasti menang atas bulan rencana. Kalau bulannya belum tercatat,
  // tambahkan, supaya penghitung per bulan di peta tahun tidak melewatkannya.
  const mergedMonths = normalizeProgramMonths([...months, ...monthsBetween(usableStart, lastDay, year)])

  return {
    precision: 'exact',
    isRecurring,
    months: mergedMonths,
    bands: [
      {
        from: yearFraction(usableStart, year),
        to: yearFraction(exclusiveEnd, year),
        month: startMonth,
      },
    ],
    startDate: usableStart,
    endDate: usableEnd,
    dayCount,
    label: formatExactLabel(usableStart, usableEnd),
  }
}

function buildPlannedSchedule(
  months: number[],
  isRecurring: boolean,
  year: number,
): ProgramSchedule {
  if (months.length === 0) {
    return {
      precision: 'unscheduled',
      isRecurring,
      months: [],
      bands: [],
      label: 'Belum dijadwalkan',
    }
  }

  return {
    precision: 'planned',
    isRecurring,
    months,
    bands: monthBands(months, year),
    label: formatPlannedLabel(months, isRecurring),
  }
}

/** Setiap bulan yang tersentuh rentang tanggal, dibatasi pada tahun papan. */
function monthsBetween(start: Date, end: Date, year: number): number[] {
  const months: number[] = []
  const first = start.getUTCFullYear() === year ? start.getUTCMonth() + 1 : 1
  const last = end.getUTCFullYear() === year ? end.getUTCMonth() + 1 : 12

  for (let month = first; month <= last; month += 1) {
    months.push(month)
  }

  return months
}

/**
 * Label satu baris untuk kartu program.
 *
 * Ada terpisah dari `schedule.label` karena bentuk panjangnya ("Direncanakan
 * Maret, Juni, September, Desember") membungkus jadi dua baris di kartu dan
 * membuat tinggi kartu tidak seragam. Bentuk panjang tetap dipakai di tempat
 * yang ruangnya cukup, misalnya daftar isi bulan di /agenda.
 */
export function formatScheduleShort(schedule: ProgramSchedule): string {
  if (schedule.precision === 'unscheduled') {
    return 'Belum dijadwalkan'
  }

  if (schedule.precision === 'exact' && schedule.startDate) {
    const start = schedule.startDate
    const end = schedule.endDate
    const startText = `${start.getUTCDate()} ${MONTH_NAMES_SHORT[start.getUTCMonth()]}`

    if (!end || end.getTime() === start.getTime()) {
      return startText
    }

    if (end.getUTCMonth() === start.getUTCMonth()) {
      return `${start.getUTCDate()}-${end.getUTCDate()} ${MONTH_NAMES_SHORT[start.getUTCMonth()]}`
    }

    return `${startText} - ${end.getUTCDate()} ${MONTH_NAMES_SHORT[end.getUTCMonth()]}`
  }

  if (schedule.months.length === 12) {
    return schedule.isRecurring ? 'Tiap bulan' : 'Sepanjang tahun'
  }

  return schedule.months.map((month) => MONTH_NAMES_SHORT[month - 1]).join(' · ')
}

function formatExactLabel(start: Date, end?: Date): string {
  const year = start.getUTCFullYear()
  const startDay = start.getUTCDate()
  const startMonth = MONTH_NAMES_LONG[start.getUTCMonth()]

  if (!end || end.getTime() === start.getTime()) {
    return `${startDay} ${startMonth} ${year}`
  }

  const endDay = end.getUTCDate()
  const endMonth = MONTH_NAMES_LONG[end.getUTCMonth()]
  const endYear = end.getUTCFullYear()

  if (startMonth === endMonth && year === endYear) {
    return `${startDay}-${endDay} ${startMonth} ${year}`
  }

  if (year === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`
  }

  return `${startDay} ${startMonth} ${year} - ${endDay} ${endMonth} ${endYear}`
}

function formatPlannedLabel(months: number[], isRecurring: boolean): string {
  if (months.length === 12) {
    return isRecurring ? 'Setiap bulan' : 'Sepanjang tahun'
  }

  const runs: Array<[number, number]> = []
  months.forEach((month) => {
    const previous = runs[runs.length - 1]

    if (previous && month === previous[1] + 1) {
      previous[1] = month
      return
    }

    runs.push([month, month])
  })

  const parts = runs.map(([first, last]) =>
    first === last
      ? MONTH_NAMES_LONG[first - 1]
      : `${MONTH_NAMES_LONG[first - 1]}-${MONTH_NAMES_LONG[last - 1]}`,
  )

  return `Direncanakan ${parts.join(', ')}`
}
