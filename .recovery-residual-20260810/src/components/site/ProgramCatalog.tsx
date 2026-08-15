'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'
import { DateBadge } from './DateBadge'
import { getProgramHref } from '@/lib/organization-slugs'
import {
  MONTH_NAMES_SHORT,
  buildProgramSchedule,
  formatScheduleShort,
  type ProgramSchedule,
} from '@/lib/program-schedule'
import type { Division, DivisionCode, Program, ProgramStatus } from '@/types/content'

/*
 * Katalog program kerja untuk /program-kerja.
 *
 * Tiga versi sebelumnya gagal dengan cara yang sama: 37 program digambar sebagai
 * 37 objek seragam, entah baris ledger, kartu bergaris, atau kartu putih lega.
 * Yang bikin lelah bukan bentuk kartunya, melainkan tidak adanya satu pun
 * pembeda di antara tiga puluh tujuh benda yang identik.
 *
 * Sekarang katalog ini adalah REGISTER berkelompok. Program masuk ke bidangnya,
 * dan tiap bidang dibuka satu palang berwarna miliknya sendiri. Menggulir
 * katalog berarti melewati delapan pita warna, bukan satu tembok putih. Barisnya
 * dibuat padat, bukan dilegakan: tiga puluh tujuh benda yang harus dibandingkan
 * memang lebih baik dibaca sebagai daftar daripada sebagai kartu.
 *
 * Pilihan "Abjad" dibuang. Tidak ada satu pun pertanyaan nyata yang dijawab
 * dengan mengurutkan program kerja menurut huruf pertamanya.
 *
 * --- Putaran berikutnya, setelah katalog ini disebut "terlalu polos" ---
 *
 * Diagnosisnya tepat, dan sebabnya bukan kurang hiasan. Delapan kelompok yang
 * dibuka palang warna tetap delapan benda dengan SILUET yang persis sama, dan
 * mata tidak punya satu pun pegangan untuk membedakan "ini bagian mana" selain
 * membaca judulnya. Yang ditambahkan sekarang semuanya berupa keterangan, bukan
 * ornamen:
 *
 *   sidik bulan   dua belas sel di kepala tiap kelompok, menyala di bulan
 *                 bidang itu bekerja. Tiap bidang jadi punya bentuk sendiri,
 *                 dan bentuk itu bisa dibandingkan antar bidang tanpa membaca.
 *   nomor register angka urut mono di tiap baris. Membuat daftar terbaca sebagai
 *                 daftar yang bisa dirujuk, dan sekaligus memberi ritme tegak.
 *   tanda sorotan program yang ditandai pengurus dapat tanda emas yang sama
 *                 persis dengan yang dipakai papan di atas.
 *   palang lengket saringan menempel di puncak layar saat katalog digulir,
 *                 lengkap dengan jumlah hasil yang hidup. Tanpa itu, menyaring
 *                 sesuatu yang panjangnya tiga puluh tujuh baris berarti
 *                 menggulir balik ke atas untuk mengubah pikiran.
 */

type ProgramCatalogProps = {
  divisions: Division[]
  programsByDivision: Record<DivisionCode, Program[]>
  /*
   * Diturunkan dari halaman, bukan dibaca sendiri. Tahun papan sekarang tinggal
   * di settings/site, dan komponen ini berjalan di browser: membacanya dari
   * sini berarti satu permintaan Firestore tambahan per pengunjung untuk satu
   * angka yang sudah diketahui server saat merender.
   */
  year: number
}

type CatalogProgram = Program & {
  divisionCode: DivisionCode
  divisionName: string
  divisionShortName: string
  schedule: ProgramSchedule
}

type StatusFilter = ProgramStatus | 'ALL'
type ViewMode = 'bidang' | 'waktu'

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Semua pola', value: 'ALL' },
  { label: 'Terjadwal', value: 'Terjadwal' },
  { label: 'Berkala', value: 'Berkala' },
]

const viewOptions: Array<{ label: string; value: ViewMode }> = [
  { label: 'Per bidang', value: 'bidang' },
  { label: 'Urut waktu', value: 'waktu' },
]

/** Program tanpa jadwal turun ke bawah, bukan naik karena bandnya kosong. */
function byScheduleThenName(first: CatalogProgram, second: CatalogProgram) {
  return (
    (first.schedule.bands[0]?.from ?? 2) - (second.schedule.bands[0]?.from ?? 2) ||
    first.name.localeCompare(second.name, 'id')
  )
}

export function ProgramCatalog({ divisions, programsByDivision, year }: ProgramCatalogProps) {
  const [activeDivision, setActiveDivision] = useState<DivisionCode | 'ALL'>('ALL')
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL')
  const [datedOnly, setDatedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('bidang')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const programs = useMemo<CatalogProgram[]>(
    () =>
      divisions.flatMap((division) =>
        programsByDivision[division.code].map((program) => ({
          ...program,
          divisionCode: division.code,
          divisionName: division.name,
          divisionShortName: division.shortName,
          schedule: buildProgramSchedule(program, year),
        })),
      ),
    [divisions, programsByDivision, year],
  )

  const datedCount = useMemo(
    () => programs.filter((program) => program.schedule.precision === 'exact').length,
    [programs],
  )

  const visiblePrograms = useMemo(
    () =>
      programs.filter((program) => {
        const matchesDivision = activeDivision === 'ALL' || program.divisionCode === activeDivision
        const matchesStatus = activeStatus === 'ALL' || program.status === activeStatus
        const matchesDated = !datedOnly || program.schedule.precision === 'exact'
        const matchesQuery =
          deferredQuery.length === 0 ||
          `${program.name} ${program.desc} ${program.divisionName}`
            .toLowerCase()
            .includes(deferredQuery)

        return matchesDivision && matchesStatus && matchesDated && matchesQuery
      }),
    [activeDivision, activeStatus, datedOnly, deferredQuery, programs],
  )

  /*
   * Bidang yang seluruh programnya tersaring habis tidak dibangkitkan sama
   * sekali, jadi katalog tidak pernah menampilkan palang bidang di atas ruang
   * kosong. Urutannya mengikuti `divisions`, yang sudah datang terurut dari
   * halaman, bukan urutan kemunculan program.
   */
  const groups = useMemo(() => {
    if (viewMode !== 'bidang') return []

    return divisions.flatMap((division) => {
      const members = visiblePrograms.filter((program) => program.divisionCode === division.code)
      return members.length > 0 ? [{ division, programs: members }] : []
    })
  }, [divisions, viewMode, visiblePrograms])

  const timeline = useMemo(
    () => (viewMode === 'waktu' ? [...visiblePrograms].sort(byScheduleThenName) : []),
    [viewMode, visiblePrograms],
  )

  function resetFilters() {
    setActiveDivision('ALL')
    setActiveStatus('ALL')
    setDatedOnly(false)
    setQuery('')
  }

  function renderRow(program: CatalogProgram, index: number, withDivisionTag: boolean) {
    return (
      <li key={`${program.divisionCode}-${program.name}`}>
        <Link
          className="pk-row"
          href={getProgramHref(program)}
          data-div={program.divisionCode}
          data-featured={program.featured || undefined}
        >
          {/*
            Nomor register. Sengaja dihitung dari posisi baris SETELAH
            penyaringan, bukan nomor tetap milik programnya: yang dijawabnya
            "ini yang keberapa dari yang sedang saya lihat", dan nomor tetap
            yang meloncat-loncat (03, 09, 21) justru terbaca seperti data yang
            hilang.
          */}
          <span className="pk-row-no" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <DateBadge schedule={program.schedule} />
          <span className="pk-row-copy">
            <strong>
              {program.name}
              {program.featured ? (
                <i className="pk-row-star" aria-hidden="true" title="Program sorotan" />
              ) : null}
            </strong>
            <small>{program.desc}</small>
          </span>
          <span className="pk-row-meta">
            {withDivisionTag ? (
              <span className="soft-tag">{program.divisionShortName}</span>
            ) : null}
            <span className="soft-tag soft-tag-quiet">{program.status}</span>
            <time dateTime={program.startDate || undefined}>
              {formatScheduleShort(program.schedule)}
            </time>
          </span>
          <span className="pk-row-chev" aria-hidden="true">
            ›
          </span>
          {program.featured ? <span className="sr-only">Program sorotan</span> : null}
        </Link>
      </li>
    )
  }

  const isFiltered =
    activeDivision !== 'ALL' || activeStatus !== 'ALL' || datedOnly || deferredQuery.length > 0

  return (
    <div className="pk">
      <div className="pk-masthead">
        <div>
          <p className="pk-masthead-kicker">Indeks · {year}/{year + 1}</p>
          <h2 id="catalog-title">Semua program kerja.</h2>
        </div>
        <p className="pk-subhead">
          {programs.length} program dari delapan bidang. {datedCount} di antaranya sudah punya
          tanggal pasti; sisanya baru punya bulan rencana dari Buku Panduan.
        </p>
      </div>

      {/*
        Palang saringan menempel di puncak layar begitu katalog mulai digulir.
        Tanpa itu, mengubah pikiran di tengah daftar sepanjang tiga puluh tujuh
        baris berarti menggulir balik ke atas dulu — dan siapa pun yang harus
        melakukannya sekali tidak akan melakukannya dua kali.
      */}
      <div className="pk-filters">
        {/*
          Dua baris, bukan tiga, dan pembagiannya bukan soal muat-muatan. Baris
          pertama menjawab "saya mencari apa" (kata kunci dan bidang), baris
          kedua "tampilkan bagaimana" (pola jadwal dan susunan). Sebagai tiga
          baris pil, palang ini setinggi 182px — bersama header situs itu
          sepertiga layar laptop yang permanen tertutup kendali, bukan isi.
        */}
        <div className="pk-filters-row">
          <label className="soft-search">
            <span className="sr-only">Cari program kerja</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari program"
            />
          </label>

          <div className="soft-pills" role="group" aria-label="Filter bidang">
            <button
              type="button"
              className={activeDivision === 'ALL' ? 'is-active' : undefined}
              aria-pressed={activeDivision === 'ALL'}
              onClick={() => setActiveDivision('ALL')}
            >
              Semua
            </button>
            {divisions.map((division) => (
              <button
                type="button"
                key={division.code}
                data-div={division.code}
                className={activeDivision === division.code ? 'is-active' : undefined}
                aria-pressed={activeDivision === division.code}
                onClick={() =>
                  setActiveDivision(activeDivision === division.code ? 'ALL' : division.code)
                }
                title={division.name}
              >
                <i aria-hidden="true" />
                {division.shortName}
              </button>
            ))}
          </div>
        </div>

        <div className="pk-filters-row">
          <div className="soft-pills" role="group" aria-label="Filter pola jadwal">
            {statusOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={activeStatus === option.value ? 'is-active' : undefined}
                aria-pressed={activeStatus === option.value}
                onClick={() => setActiveStatus(option.value)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={datedOnly ? 'is-active' : undefined}
              aria-pressed={datedOnly}
              onClick={() => setDatedOnly(!datedOnly)}
            >
              Bertanggal
            </button>
          </div>

          <div className="soft-pills" role="group" aria-label="Cara menyusun">
            {viewOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={viewMode === option.value ? 'is-active' : undefined}
                aria-pressed={viewMode === option.value}
                onClick={() => setViewMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Jumlah hasil hidup. Satu-satunya umpan balik yang membuktikan
              saringan benar-benar bekerja saat hasilnya masih di luar layar. */}
          <p className="pk-count" role="status" aria-live="polite">
            <b>{visiblePrograms.length}</b>
            <span>dari {programs.length} program</span>
            {isFiltered ? (
              <button type="button" onClick={resetFilters}>
                Reset
              </button>
            ) : null}
          </p>
        </div>
      </div>

      {visiblePrograms.length === 0 ? (
        <div className="soft-empty">
          <strong>Program tidak ditemukan</strong>
          <p>Coba kata kunci atau kombinasi filter yang berbeda.</p>
          <button type="button" onClick={resetFilters}>
            Reset filter
          </button>
        </div>
      ) : viewMode === 'bidang' ? (
        <div className="pk-register">
          {groups.map(({ division, programs: members }) => (
            <section className="pk-group" key={division.code} data-div={division.code}>
              <header className="pk-group-head">
                <span className="pk-group-mark">{division.shortName}</span>
                <div className="pk-group-title">
                  <h3>{division.name}</h3>
                  <p>
                    {members.length} program
                    {members.length !== programsByDivision[division.code].length
                      ? ` dari ${programsByDivision[division.code].length}`
                      : ''}
                  </p>
                </div>
                <MonthFingerprint programs={members} />
              </header>
              <ul className="pk-rows">
                {members.map((program, index) => renderRow(program, index, false))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="pk-register">
          <section className="pk-group pk-group-flat">
            <ul className="pk-rows">
              {timeline.map((program, index) => renderRow(program, index, true))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

/**
 * Sidik bulan sebuah bidang: dua belas sel, menyala di bulan bidang itu bekerja.
 *
 * Ada karena delapan kepala kelompok yang isinya cuma nama dan angka punya
 * siluet yang persis sama, dan itu yang membuat katalog terbaca datar. Sidik
 * ini memberi tiap bidang bentuk yang khas — PHAL menyala di dua bulan, PSDM
 * tersebar hampir merata — dan bentuk itu langsung bisa dibandingkan tanpa
 * membaca satu kata pun.
 *
 * Program yang berjalan dua belas bulan penuh TIDAK dihitung, aturan yang sama
 * persis dengan papan tahun di atas halaman ini. Versi pertama menghitungnya,
 * dan hasilnya enam dari delapan bidang menyala penuh: sidiknya jadi seragam,
 * yang justru kebalikan dari gunanya. Program rutin memang tidak punya bentuk
 * di sumbu waktu, karena bentuknya adalah seluruh sumbu.
 *
 * Sengaja tidak diberi angka atau sumbu. Ia penunjuk pola, bukan bagan; yang
 * butuh angka pastinya sudah dilayani papan di atas.
 */
function MonthFingerprint({ programs }: { programs: CatalogProgram[] }) {
  const load = useMemo(() => {
    const counts = new Array<number>(12).fill(0)

    programs.forEach((program) => {
      if (program.schedule.months.length === 12) return

      program.schedule.months.forEach((month) => {
        counts[month - 1] += 1
      })
    })

    return counts
  }, [programs])

  const peak = Math.max(...load)
  const activeMonths = load.filter((count) => count > 0).length

  // Bidang yang seluruh programnya berjalan sepanjang tahun tidak punya sidik.
  // Dua belas sel abu yang semuanya padam terbaca seperti data yang gagal
  // dimuat, dan itu lebih buruk daripada tidak menggambar apa pun.
  if (activeMonths === 0) {
    return null
  }

  return (
    <div
      className="pk-print"
      role="img"
      aria-label={`Program bertanggal atau berbulan bidang ini jatuh di ${activeMonths} dari 12 bulan.`}
    >
      {load.map((count, index) => (
        <i
          key={MONTH_NAMES_SHORT[index]}
          data-on={count > 0 || undefined}
          // Kepekatan dibuat bertingkat, bukan menyala-padam saja: bulan
          // dengan empat program memang bukan hal yang sama dengan bulan
          // dengan satu.
          style={{ '--w': count / peak } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
