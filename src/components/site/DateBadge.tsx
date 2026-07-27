import { MONTH_NAMES_SHORT, type ProgramSchedule } from '@/lib/program-schedule'

/*
 * Penanda waktu untuk kartu program.
 *
 * Menggantikan rail dua belas bulan yang dulu dipasang di tiap kartu. Rail itu
 * sumber keramaian: tiga puluh tujuh gambar garis kecil dalam satu layar, dan
 * tidak satu pun bisa dibaca sekilas. Badge ini menjawab satu pertanyaan saja,
 * yaitu "kapan", dan menjawabnya dengan angka yang benar-benar terbaca.
 *
 * Tingkat kepastian dibedakan lewat NADA, bukan lewat keterangan tambahan:
 * tanggal pasti memakai warna bidangnya dan menampilkan angka hari; yang baru
 * direncanakan tampil abu dan hanya menyebut bulan. Bedanya terlihat tanpa
 * legenda.
 */

type DateBadgeProps = {
  schedule: ProgramSchedule
  /**
   * Bulan yang sedang dilihat pembaca, kalau badge ini muncul di dalam konteks
   * satu bulan tertentu.
   *
   * Tanpa ini, program berkala di dalam daftar bulan Juli tampil sebagai
   * "12 BULAN", dan angka 12 itu terbaca seperti tanggal. Di dalam satu bulan,
   * jawaban yang benar untuk "kapan" adalah bulan yang sedang dibuka.
   */
  contextMonth?: number
}

export function DateBadge({ schedule, contextMonth }: DateBadgeProps) {
  if (schedule.precision === 'exact' && schedule.startDate) {
    return (
      <span className="date-badge" data-precision="exact">
        <b>{schedule.startDate.getUTCDate()}</b>
        <span>{MONTH_NAMES_SHORT[schedule.startDate.getUTCMonth()]}</span>
      </span>
    )
  }

  if (schedule.precision === 'planned') {
    if (contextMonth) {
      return (
        <span className="date-badge" data-precision="planned">
          <span>{MONTH_NAMES_SHORT[contextMonth - 1]}</span>
        </span>
      )
    }

    // Di luar konteks satu bulan, program sepanjang tahun tidak punya bulan
    // jangkar. Menyebut "Jan" saja akan menyesatkan, jadi yang ditampilkan
    // jumlah bulannya.
    if (schedule.months.length === 12) {
      return (
        <span className="date-badge" data-precision="planned">
          <b>12</b>
          <span>Bulan</span>
        </span>
      )
    }

    const [first, ...rest] = schedule.months

    return (
      <span className="date-badge" data-precision="planned">
        <span>{MONTH_NAMES_SHORT[first - 1]}</span>
        {rest.length > 0 && <b className="date-badge-more">+{rest.length}</b>}
      </span>
    )
  }

  return (
    <span className="date-badge" data-precision="unscheduled">
      <span>Belum</span>
    </span>
  )
}
