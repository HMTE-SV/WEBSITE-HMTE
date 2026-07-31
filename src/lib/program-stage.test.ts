import { describe, expect, it } from 'vitest'
import { assignLanes, buildStageRows, monthAtFraction, nowFraction } from './program-stage'
import type { Division, DivisionCode, Program } from '@/types/content'

const YEAR = 2026

const division: Division = {
  code: 'PSDM',
  name: 'Pengembangan Sumber Daya Manusia',
  shortName: 'PSDM',
  description: '',
  order: 1,
}

function makeProgram(overrides: Partial<Program> & Pick<Program, 'name'>): Program {
  return {
    desc: 'Deskripsi uji.',
    status: 'Terjadwal',
    date: '',
    ...overrides,
  }
}

function buildOne(programs: Program[]) {
  const byDivision = { PSDM: programs } as unknown as Record<DivisionCode, Program[]>
  return buildStageRows({ divisions: [division], programsByDivision: byDivision, year: YEAR })[0]
}

describe('assignLanes', () => {
  it('menaruh dua program yang tidak bertumpuk di jalur yang sama', () => {
    expect(assignLanes([{ from: 0, to: 0.2 }, { from: 0.5, to: 0.7 }])).toEqual([0, 0])
  })

  it('menurunkan program yang bertumpuk waktunya ke jalur berikutnya', () => {
    expect(assignLanes([{ from: 0, to: 0.5 }, { from: 0.3, to: 0.8 }])).toEqual([0, 1])
  })

  /*
   * Tanpa jarak minimum, satu program yang berakhir 31 Maret dan satu yang
   * mulai 1 April digambar bersentuhan dan terbaca sebagai satu balok panjang.
   */
  it('memisahkan dua program yang bersambungan tepat', () => {
    expect(assignLanes([{ from: 0, to: 0.25 }, { from: 0.25, to: 0.5 }])).toEqual([0, 1])
  })

  it('memakai kembali jalur yang sudah kosong lagi', () => {
    const lanes = assignLanes([
      { from: 0, to: 0.3 },
      { from: 0.1, to: 0.4 },
      { from: 0.6, to: 0.8 },
    ])

    expect(lanes).toEqual([0, 1, 0])
  })

  it('tidak peduli urutan masukan', () => {
    const lanes = assignLanes([
      { from: 0.6, to: 0.8 },
      { from: 0, to: 0.3 },
    ])

    // Yang paling kiri selalu dapat jalur nol, di posisi apa pun ia ditulis.
    expect(lanes).toEqual([0, 0])
  })
})

describe('buildStageRows', () => {
  it('memisahkan program menurut cara ia menempati waktu', () => {
    const row = buildOne([
      makeProgram({ name: 'Sekali di April', months: [4] }),
      makeProgram({ name: 'Tiap bulan', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
      makeProgram({ name: 'Belum dijadwalkan' }),
    ])

    expect(row.blocks.map((block) => block.name)).toEqual(['Sekali di April'])
    expect(row.ambient.map((item) => item.name)).toEqual(['Tiap bulan'])
    expect(row.deferred.map((item) => item.name)).toEqual(['Belum dijadwalkan'])
    expect(row.total).toBe(3)
  })

  it('memecah program berkala jadi satu balok per kemunculan', () => {
    const row = buildOne([makeProgram({ name: 'SOTM', status: 'Berkala', months: [3, 6, 9, 12] })])

    expect(row.blocks).toHaveLength(4)
    expect(row.blocks.map((block) => block.repeatIndex)).toEqual([0, 1, 2, 3])
    expect(row.blocks.every((block) => block.repeatCount === 4)).toBe(true)
  })

  it('menggabungkan bulan berurutan jadi satu balok panjang', () => {
    const row = buildOne([makeProgram({ name: 'Panjang', months: [3, 4, 5] })])

    expect(row.blocks).toHaveLength(1)
    expect(row.blocks[0].to - row.blocks[0].from).toBeGreaterThan(0.24)
  })

  it('selalu punya minimal satu jalur meski tidak ada balok', () => {
    expect(buildOne([]).laneCount).toBe(1)
  })

  it('menandai tanggal pasti sebagai exact', () => {
    const row = buildOne([
      makeProgram({ name: 'Raker', months: [4], startDate: '2026-04-12', endDate: '2026-04-14' }),
    ])

    expect(row.blocks[0].precision).toBe('exact')
  })
})

describe('penempatan nama balok', () => {
  it('menulis nama di dalam balok yang cukup lebar', () => {
    const row = buildOne([makeProgram({ name: 'Panjang', months: [3, 4, 5] })])
    expect(row.blocks[0].labelPlacement).toBe('inside')
  })

  it('memindahkan nama ke luar kalau baloknya sempit tapi ruang di kanannya kosong', () => {
    const row = buildOne([makeProgram({ name: 'Sempit', months: [4] })])
    expect(row.blocks[0].labelPlacement).toBe('outside')
  })

  /*
   * Nama di luar balok hanya boleh ditulis kalau jalurnya memang kosong sampai
   * jauh. Kalau balok berikutnya datang cepat, namanya akan jatuh persis di
   * atas milik orang lain.
   */
  it('mengembalikan nama ke dalam kalau balok berikutnya datang terlalu cepat', () => {
    // April lalu Juni: keduanya masuk jalur yang sama, dan celah satu bulan di
    // antaranya hanya sekitar 87px di layar 1050. Tidak ada nama program yang
    // muat di sana tanpa jatuh ke atas balok Juni.
    const row = buildOne([
      makeProgram({ name: 'Pertama', months: [4] }),
      makeProgram({ name: 'Kedua', months: [6] }),
    ])

    const first = row.blocks.find((block) => block.name === 'Pertama')
    expect(first?.lane).toBe(0)
    expect(row.blocks.find((block) => block.name === 'Kedua')?.lane).toBe(0)
    expect(first?.labelPlacement).toBe('inside')
  })

  it('menulis nama di luar untuk balok terakhir di jalurnya', () => {
    // Tidak ada balok sesudahnya, jadi ruang sampai ujung tahun selalu cukup.
    const row = buildOne([makeProgram({ name: 'Terakhir', months: [9] })])
    expect(row.blocks[0].labelPlacement).toBe('outside')
  })
})

describe('nowFraction', () => {
  it('menempatkan awal Januari di dekat nol dan akhir Desember di dekat satu', () => {
    expect(nowFraction(YEAR, new Date(YEAR, 0, 1))).toBeCloseTo(0, 5)
    expect(nowFraction(YEAR, new Date(YEAR, 11, 31))).toBeGreaterThan(0.99)
  })

  /*
   * Garis "hari ini" yang menggantung di tahun yang salah lebih buruk daripada
   * papan tanpa garis sama sekali.
   */
  it('tidak menggambar apa pun kalau tahunnya bukan tahun papan', () => {
    expect(nowFraction(YEAR, new Date(2027, 5, 1))).toBeNull()
  })
})

describe('monthAtFraction', () => {
  it('memetakan posisi 0..1 ke bulan 1..12', () => {
    expect(monthAtFraction(0)).toBe(1)
    expect(monthAtFraction(0.5)).toBe(7)
    // Tepat di ujung kanan tetap Desember, bukan bulan ketiga belas.
    expect(monthAtFraction(1)).toBe(12)
  })

  it('menjepit nilai di luar jangkauan', () => {
    expect(monthAtFraction(-3)).toBe(1)
    expect(monthAtFraction(9)).toBe(12)
  })
})
