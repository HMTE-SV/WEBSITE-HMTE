import { buildProgramSchedule, type ProgramSchedule } from '@/lib/program-schedule'
import { getProgramHref } from '@/lib/organization-slugs'
import type { Division, DivisionCode, Program } from '@/types/content'

/*
 * Geometri papan tahun di /program-kerja.
 *
 * Halaman ini menggambar satu periode kerja sebagai delapan pita mendatar, satu
 * per bidang, membentang Januari sampai Desember. Tiap program jadi balok yang
 * posisinya adalah waktunya. Baru dengan bentuk itu sebuah pertanyaan yang
 * selama ini tidak pernah bisa dijawab situs ini jadi bisa dijawab sekilas:
 * kapan himpunan ini sibuk, dan siapa yang sedang memikulnya.
 *
 * Berkas ini murni. Tidak ada React, tidak ada Firebase, tidak ada DOM. Yang
 * dihasilkannya cuma angka, dan itu yang membuat penataan jalurnya bisa dites
 * tanpa merender apa pun.
 *
 * Tiga jenis program diperlakukan berbeda karena memang tiga hal berbeda:
 *
 *   balok    program yang jatuh di bulan tertentu, digambar sebagai balok
 *   dengung  program yang berjalan dua belas bulan, digambar sebagai pita
 *            samar selebar baris. Menggambarnya sebagai balok penuh akan
 *            membuat sebelas dari tiga puluh tujuh program menutupi seluruh
 *            papan dan menghapus bentuk tahunnya.
 *   tunda    program tanpa bulan maupun tanggal, tidak digambar sama sekali
 *            dan disebut terpisah. Menaruhnya di Januari adalah karangan.
 */

export type StageBlock = {
  /** Unik per balok, bukan per program: satu program bisa punya beberapa. */
  key: string
  name: string
  href: string
  desc: string
  divisionCode: DivisionCode
  /** Tepi kiri dan kanan sebagai fraksi tahun 0..1. */
  from: number
  to: number
  /** Jalur ke berapa di dalam baris bidangnya. Mulai dari 0. */
  lane: number
  scheduleLabel: string
  precision: ProgramSchedule['precision']
  featured: boolean
  /** Program yang jatuh berkali-kali dalam setahun, mis. SOTM. */
  repeatIndex: number
  repeatCount: number
  /**
   * Di mana nama programnya ditulis.
   *
   * Balok selebar satu bulan cuma sekitar 90px di layar 1400, dan tidak ada
   * nama program yang muat di sana. Versi pertama menulis inisial bulannya
   * ("A", "S", "D") di dalam balok, dan itu keterangan kosong: posisi baloknya
   * di sumbu waktu SUDAH menyebut bulannya, jadi hurufnya cuma mengulang apa
   * yang sudah terbaca sambil menyembunyikan apa yang belum.
   *
   * Sekarang nama yang tidak muat ditulis di sebelah kanan baloknya, seperti
   * yang dilakukan bagan Gantt sungguhan, tapi hanya kalau memang ada ruang
   * kosong di jalur itu. Kalau balok berikutnya datang terlalu cepat, namanya
   * kembali ke dalam balok dan dipotong dengan elipsis: "Musta dan..." masih
   * menyebut program yang mana, dan itu jauh lebih berguna daripada balok
   * anonim.
   */
  labelPlacement: 'inside' | 'outside'
}

/** Balok selebar ini ke atas muat memuat nama programnya sendiri. */
const INSIDE_LABEL_WIDTH = 0.145

/** Ruang kosong sesudah balok yang cukup untuk menampung nama di luarnya. */
const OUTSIDE_LABEL_ROOM = 0.1

export type StageAmbient = {
  name: string
  href: string
  desc: string
}

export type StageRow = {
  division: Division
  blocks: StageBlock[]
  /** Selalu minimal 1, supaya baris kosong tetap punya tinggi. */
  laneCount: number
  ambient: StageAmbient[]
  deferred: StageAmbient[]
  /** Semua program bidang ini, termasuk yang tidak digambar. */
  total: number
}

/**
 * Jarak minimum antar balok dalam satu jalur, sebagai fraksi tahun.
 *
 * Tanpa ini, dua program yang bersambungan tepat (satu berakhir 31 Maret, satu
 * mulai 1 April) digambar bersentuhan dan terbaca sebagai satu balok panjang.
 * Nilainya kira-kira dua setengah hari, cukup untuk memisahkan secara visual
 * tanpa mengarang jeda yang tidak ada di datanya.
 */
const LANE_GAP = 0.007

/**
 * Menempatkan balok ke jalur seminimal mungkin.
 *
 * Serakah, dan itu memang cukup: balok sudah diurutkan dari kiri, jadi
 * menempatkan tiap balok ke jalur pertama yang ujungnya sudah lewat menghasilkan
 * jumlah jalur yang optimal untuk interval di satu garis waktu. Ini masalah
 * pewarnaan graf interval, yang serakah-dari-kiri memang menyelesaikannya tepat.
 */
export function assignLanes(blocks: Array<{ from: number; to: number }>): number[] {
  const laneEnds: number[] = []
  const order = blocks
    .map((block, index) => ({ block, index }))
    .sort((first, second) => first.block.from - second.block.from || first.index - second.index)

  const lanes = new Array<number>(blocks.length).fill(0)

  order.forEach(({ block, index }) => {
    let lane = laneEnds.findIndex((end) => end <= block.from - LANE_GAP)

    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }

    laneEnds[lane] = block.to
    lanes[index] = lane
  })

  return lanes
}

type BuildOptions = {
  divisions: Division[]
  programsByDivision: Record<DivisionCode, Program[]>
  year: number
}

export function buildStageRows({ divisions, programsByDivision, year }: BuildOptions): StageRow[] {
  return divisions.map((division) => {
    const programs = programsByDivision[division.code] ?? []
    const draft: Array<Omit<StageBlock, 'lane'>> = []
    const ambient: StageAmbient[] = []
    const deferred: StageAmbient[] = []

    programs.forEach((program) => {
      const schedule = buildProgramSchedule(program, year)
      const entry: StageAmbient = {
        name: program.name,
        href: getProgramHref(program),
        desc: program.desc,
      }

      if (schedule.months.length === 0) {
        deferred.push(entry)
        return
      }

      if (schedule.months.length === 12) {
        ambient.push(entry)
        return
      }

      schedule.bands.forEach((band, index) => {
        draft.push({
          key: `${division.code}-${program.name}-${index}`,
          name: program.name,
          href: entry.href,
          desc: program.desc,
          divisionCode: division.code,
          from: band.from,
          to: band.to,
          scheduleLabel: schedule.label,
          precision: schedule.precision,
          featured: program.featured === true,
          repeatIndex: index,
          repeatCount: schedule.bands.length,
          labelPlacement: 'inside',
        })
      })
    })

    const lanes = assignLanes(draft)
    const blocks = draft.map((block, index) => ({ ...block, lane: lanes[index] }))

    return {
      division,
      blocks: placeLabels(blocks),
      laneCount: Math.max(1, ...lanes.map((lane) => lane + 1)),
      ambient,
      deferred,
      total: programs.length,
    }
  })
}

/**
 * Memutuskan di mana nama tiap balok ditulis.
 *
 * Harus dikerjakan setelah jalur ditetapkan, bukan sebelumnya: ruang yang
 * tersedia untuk nama di luar balok adalah jarak ke balok BERIKUTNYA DI JALUR
 * YANG SAMA, dan itu belum diketahui sampai penataan jalurnya selesai.
 */
export function placeLabels(blocks: StageBlock[]): StageBlock[] {
  const nextFromByLane = new Map<number, number[]>()

  blocks.forEach((block) => {
    const starts = nextFromByLane.get(block.lane) ?? []
    starts.push(block.from)
    nextFromByLane.set(block.lane, starts)
  })

  nextFromByLane.forEach((starts) => starts.sort((first, second) => first - second))

  return blocks.map((block) => {
    if (block.to - block.from >= INSIDE_LABEL_WIDTH) {
      return { ...block, labelPlacement: 'inside' as const }
    }

    const starts = nextFromByLane.get(block.lane) ?? []
    const nextStart = starts.find((start) => start > block.from)
    const room = (nextStart ?? 1) - block.to

    return {
      ...block,
      labelPlacement: room >= OUTSIDE_LABEL_ROOM ? ('outside' as const) : ('inside' as const),
    }
  })
}

/**
 * Posisi hari ini sebagai fraksi tahun, atau null kalau tahunnya bukan tahun
 * papan. Garis "sekarang" yang menggantung di tahun yang salah lebih buruk
 * daripada papan tanpa garis sama sekali.
 */
export function nowFraction(year: number, now: Date = new Date()): number | null {
  if (now.getFullYear() !== year) {
    return null
  }

  const start = Date.UTC(year, 0, 1)
  const end = Date.UTC(year + 1, 0, 1)
  const point = Date.UTC(year, now.getMonth(), now.getDate())

  return (point - start) / (end - start)
}

/** Bulan 1-12 di bawah sebuah posisi 0..1, untuk penunjuk yang mengikuti kursor. */
export function monthAtFraction(fraction: number): number {
  const clamped = Math.min(0.9999, Math.max(0, fraction))
  return Math.floor(clamped * 12) + 1
}
