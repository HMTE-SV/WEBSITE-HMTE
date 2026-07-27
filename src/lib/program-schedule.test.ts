import { describe, expect, it } from 'vitest'
import {
  buildProgramSchedule,
  formatScheduleShort,
  monthBands,
  normalizeProgramMonths,
  parseIsoDate,
  yearFraction,
} from './program-schedule'
import type { Program } from '@/types/content'

const YEAR = 2026

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    name: 'Program uji',
    desc: 'Deskripsi uji.',
    status: 'Terjadwal',
    date: '',
    ...overrides,
  }
}

describe('parseIsoDate', () => {
  it('menerima tanggal ISO yang sah sebagai UTC', () => {
    const date = parseIsoDate('2026-04-12')

    expect(date?.getUTCFullYear()).toBe(2026)
    expect(date?.getUTCMonth()).toBe(3)
    expect(date?.getUTCDate()).toBe(12)
  })

  it('menolak tanggal yang menggulung, bukan menerimanya diam-diam', () => {
    // Date.UTC(2026, 1, 30) menggulung jadi 2 Maret. Tanggal yang menggulung
    // sendiri lebih berbahaya daripada tanggal yang ditolak.
    expect(parseIsoDate('2026-02-30')).toBeUndefined()
    expect(parseIsoDate('2026-13-01')).toBeUndefined()
  })

  it('menerima 29 Februari hanya di tahun kabisat', () => {
    expect(parseIsoDate('2028-02-29')).toBeDefined()
    expect(parseIsoDate('2026-02-29')).toBeUndefined()
  })

  it('menolak format selain YYYY-MM-DD', () => {
    expect(parseIsoDate('12/04/2026')).toBeUndefined()
    expect(parseIsoDate('2026-4-12')).toBeUndefined()
    expect(parseIsoDate('')).toBeUndefined()
    expect(parseIsoDate(undefined)).toBeUndefined()
  })
})

describe('yearFraction', () => {
  it('menempatkan 1 Januari di awal dan 31 Desember hampir di akhir', () => {
    expect(yearFraction(new Date(Date.UTC(2026, 0, 1)), YEAR)).toBe(0)
    expect(yearFraction(new Date(Date.UTC(2026, 11, 31)), YEAR)).toBeCloseTo(364 / 365, 5)
  })

  it('memakai 366 hari di tahun kabisat', () => {
    // 29 Februari mendorong 1 Juli satu hari lebih jauh dari awal tahun, jadi
    // fraksinya sedikit lebih besar (182/366) daripada di tahun biasa
    // (181/365). Kalau pembaginya dipatok 365, band akan meleset sehari.
    const leap = yearFraction(new Date(Date.UTC(2028, 6, 1)), 2028)
    const common = yearFraction(new Date(Date.UTC(2026, 6, 1)), 2026)

    expect(leap).toBeCloseTo(182 / 366, 6)
    expect(common).toBeCloseTo(181 / 365, 6)
    expect(leap).toBeGreaterThan(common)
    expect(yearFraction(new Date(Date.UTC(2028, 11, 31)), 2028)).toBeCloseTo(365 / 366, 5)
  })
})

describe('monthBands', () => {
  it('menggabungkan bulan berurutan jadi satu band memanjang', () => {
    const bands = monthBands([9, 10, 11], YEAR)

    expect(bands).toHaveLength(1)
    expect(bands[0].month).toBe(9)
    expect(bands[0].from).toBeCloseTo(yearFraction(new Date(Date.UTC(2026, 8, 1)), YEAR), 6)
    expect(bands[0].to).toBeCloseTo(yearFraction(new Date(Date.UTC(2026, 11, 1)), YEAR), 6)
  })

  it('memisahkan bulan yang tidak berurutan', () => {
    const bands = monthBands([3, 6, 9, 12], YEAR)

    expect(bands).toHaveLength(4)
    expect(bands.map((band) => band.month)).toEqual([3, 6, 9, 12])
  })

  it('menggabungkan dua belas bulan jadi satu band penuh', () => {
    const bands = monthBands([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], YEAR)

    expect(bands).toHaveLength(1)
    expect(bands[0].from).toBe(0)
    expect(bands[0].to).toBe(1)
  })
})

describe('normalizeProgramMonths', () => {
  it('membuang nilai di luar 1-12 dan duplikatnya', () => {
    expect(normalizeProgramMonths([0, 5, 13, 5, -2, 12])).toEqual([5, 12])
  })

  it('memperlakukan nilai non-array sebagai daftar kosong', () => {
    expect(normalizeProgramMonths(undefined)).toEqual([])
    expect(normalizeProgramMonths('3, 6')).toEqual([])
  })
})

describe('buildProgramSchedule', () => {
  it('menghasilkan exact saat startDate jatuh di tahun papan', () => {
    const schedule = buildProgramSchedule(
      makeProgram({ months: [4], startDate: '2026-04-12', endDate: '2026-04-14' }),
      YEAR,
    )

    expect(schedule.precision).toBe('exact')
    expect(schedule.dayCount).toBe(3)
    expect(schedule.label).toBe('12-14 April 2026')
    expect(schedule.bands).toHaveLength(1)
  })

  it('memberi kegiatan sehari lebar satu hari, bukan nol', () => {
    const schedule = buildProgramSchedule(makeProgram({ startDate: '2026-04-12' }), YEAR)
    const [band] = schedule.bands

    expect(schedule.dayCount).toBe(1)
    expect(schedule.label).toBe('12 April 2026')
    // Durasi nol akan menghilangkan kegiatannya dari perhitungan apa pun yang
    // memakai lebar band. Lapisan data harus menyatakan satu hari penuh.
    expect(band.to - band.from).toBeCloseTo(1 / 365, 6)
  })

  it('turun ke planned saat startDate ada di tahun lain', () => {
    // Tanggal di luar tahun papan tidak bisa ditempatkan di peta tahun ini.
    const schedule = buildProgramSchedule(
      makeProgram({ months: [2], startDate: '2027-02-14' }),
      YEAR,
    )

    expect(schedule.precision).toBe('planned')
    expect(schedule.startDate).toBeUndefined()
    expect(schedule.months).toEqual([2])
  })

  it('mengabaikan endDate yang lebih awal dari startDate', () => {
    const schedule = buildProgramSchedule(
      makeProgram({ startDate: '2026-04-12', endDate: '2026-04-02' }),
      YEAR,
    )

    expect(schedule.dayCount).toBe(1)
    expect(schedule.endDate).toBeUndefined()
    expect(schedule.bands[0].to).toBeGreaterThan(schedule.bands[0].from)
  })

  it('menambahkan bulan startDate ke months supaya penghitung bulan tidak bohong', () => {
    const schedule = buildProgramSchedule(
      makeProgram({ months: [2], startDate: '2026-04-12' }),
      YEAR,
    )

    expect(schedule.precision).toBe('exact')
    expect(schedule.months).toEqual([2, 4])
  })

  it('mencatat setiap bulan yang dilewati rentang lintas bulan', () => {
    const schedule = buildProgramSchedule(
      makeProgram({ startDate: '2026-04-28', endDate: '2026-06-03' }),
      YEAR,
    )

    expect(schedule.months).toEqual([4, 5, 6])
    expect(schedule.label).toBe('28 April - 3 Juni 2026')
  })

  it('menghasilkan unscheduled saat tidak ada bulan maupun tanggal', () => {
    const schedule = buildProgramSchedule(makeProgram(), YEAR)

    expect(schedule.precision).toBe('unscheduled')
    expect(schedule.bands).toEqual([])
    expect(schedule.label).toBe('Belum dijadwalkan')
  })

  it('memberi label khusus untuk program berkala sepanjang tahun', () => {
    const schedule = buildProgramSchedule(
      makeProgram({ status: 'Berkala', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
      YEAR,
    )

    expect(schedule.label).toBe('Setiap bulan')
    expect(schedule.isRecurring).toBe(true)
  })

  it('merangkai bulan rencana yang terpisah jadi label yang terbaca', () => {
    expect(buildProgramSchedule(makeProgram({ months: [3, 6, 9, 12] }), YEAR).label).toBe(
      'Direncanakan Maret, Juni, September, Desember',
    )
    expect(buildProgramSchedule(makeProgram({ months: [9, 10, 11] }), YEAR).label).toBe(
      'Direncanakan September-November',
    )
  })
})

describe('formatScheduleShort', () => {
  function short(program: Partial<Program>) {
    return formatScheduleShort(buildProgramSchedule(makeProgram(program), YEAR))
  }

  it('memadatkan jadwal panjang jadi satu baris', () => {
    // Bentuk panjangnya ("Direncanakan Maret, Juni, September, Desember")
    // membungkus dua baris di kartu dan merusak keseragaman tingginya.
    expect(short({ months: [3, 6, 9, 12] })).toBe('Mar · Jun · Sep · Des')
    expect(short({ status: 'Berkala', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })).toBe(
      'Tiap bulan',
    )
  })

  it('memadatkan tanggal pasti tanpa mengulang nama bulan', () => {
    expect(short({ startDate: '2026-04-12', endDate: '2026-04-14' })).toBe('12-14 Apr')
    expect(short({ startDate: '2026-04-12' })).toBe('12 Apr')
    expect(short({ startDate: '2026-04-28', endDate: '2026-05-03' })).toBe('28 Apr - 3 Mei')
  })

  it('tetap menyatakan program yang belum dijadwalkan', () => {
    expect(short({})).toBe('Belum dijadwalkan')
  })
})

