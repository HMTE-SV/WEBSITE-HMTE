'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildStageRows,
  monthAtFraction,
  nowFraction,
  type StageAmbient,
  type StageBlock,
  type StageRow,
} from '@/lib/program-stage'
import { MONTH_NAMES_LONG, MONTH_NAMES_SHORT } from '@/lib/program-schedule'
import type { Division, DivisionCode, Program } from '@/types/content'

/*
 * Papan tahun /program-kerja.
 *
 * Satu periode kerja digambar sebagai delapan pita mendatar. Sumbu mendatarnya
 * waktu, sumbu tegaknya bidang, dan tiap balok adalah satu program di tempat ia
 * benar-benar jatuh. Menggeser kursor menyapu tahun; menyentuh satu balok
 * meredupkan seluruh papan kecuali baris pemiliknya, dan bacaannya muncul di
 * pojok.
 *
 * Kenapa ini butuh JavaScript, dan bukan cuma HTML dengan CSS: penataan jalur
 * (dua program yang bertumpuk waktunya harus turun ke jalur berbeda), penunjuk
 * bulan yang mengikuti kursor, peredupan silang antar baris, dan bacaan yang
 * berganti tanpa memuat ulang halaman. Tidak satu pun bisa dikerjakan tanpa
 * status di sisi klien.
 *
 * Aturan yang mengikat berkas ini:
 * 1. Isi papan tampil penuh sebelum satu baris skrip pun jalan. Animasi masuk
 *    hanya dinyalakan setelah komponen hidup, lewat data-animate. Halaman yang
 *    dirender tanpa JavaScript, atau di tab yang tidak aktif, tetap lengkap.
 * 2. Tiap balok adalah tautan sungguhan. Papan ini bisa ditelusuri dengan Tab,
 *    dan fokus keyboard melakukan persis yang dilakukan kursor.
 * 3. Warna bidang membawa arti, bukan hiasan. Rona yang sama dipakai untuk
 *    bidang yang sama di seluruh halaman.
 */

type ProgramYearStageProps = {
  divisions: Division[]
  programsByDivision: Record<DivisionCode, Program[]>
  year: number
}

type Reading =
  | { kind: 'idle' }
  | { kind: 'block'; block: StageBlock; division: Division }

const LANE_HEIGHT = 30
const LANE_GAP = 5

export function ProgramYearStage({ divisions, programsByDivision, year }: ProgramYearStageProps) {
  const rows = useMemo(
    () => buildStageRows({ divisions, programsByDivision, year }),
    [divisions, programsByDivision, year],
  )

  const [reading, setReading] = useState<Reading>({ kind: 'idle' })
  const [sweep, setSweep] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)
  const fieldRef = useRef<HTMLDivElement>(null)

  /*
   * Animasi masuk dinyalakan setelah cat pertama, bukan lewat kelas awal.
   *
   * Kalau balok lahir dalam keadaan menciut lalu mengembang lewat transisi,
   * halaman yang dirender di tab tersembunyi atau oleh perayap tanpa layar akan
   * terbit dengan papan kosong: transisi tidak pernah berjalan, dan tidak ada
   * yang mengembalikannya. Jadi keadaan bawaan adalah tampil penuh, dan skrip
   * ini cuma menambah gerak di atas sesuatu yang sudah benar.
   */
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsLive(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const now = useMemo(() => nowFraction(year), [year])
  const totalPrograms = rows.reduce((sum, row) => sum + row.total, 0)
  const drawnBlocks = rows.reduce((sum, row) => sum + row.blocks.length, 0)
  const ambientCount = rows.reduce((sum, row) => sum + row.ambient.length, 0)
  const deferredCount = rows.reduce((sum, row) => sum + row.deferred.length, 0)

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const field = fieldRef.current
    if (!field) return

    const bounds = field.getBoundingClientRect()
    const fraction = (event.clientX - bounds.left) / bounds.width
    setSweep(Math.min(1, Math.max(0, fraction)))
  }

  const sweepMonth = sweep === null ? null : monthAtFraction(sweep)
  const activeDivision = reading.kind === 'block' ? reading.division.code : null

  return (
    <section
      className="stg"
      data-animate={isLive ? 'on' : 'off'}
      data-focus={activeDivision ?? undefined}
      aria-labelledby="stage-title"
    >
      <div className="stg-veil" aria-hidden="true" />

      <div className="stg-inner">
        <header className="stg-head">
          <p className="stg-eyebrow">Kabinet Abya Vistara · Periode {year}/{year + 1}</p>
          <h1 id="stage-title">
            Satu tahun,
            <br />
            <span>{totalPrograms} program</span>,
            <br />
            delapan bidang.
          </h1>
          <p className="stg-lead">
            Sumbu mendatar adalah waktu, tiap pita adalah satu bidang, tiap balok adalah satu
            program di bulan ia benar-benar jatuh. Sentuh baloknya untuk membaca, klik untuk
            membuka halamannya.
          </p>
        </header>

        {/*
          Bacaan. Diam di tempat dan hanya isinya yang berganti, bukan tooltip
          yang mengikuti kursor. Tooltip melayang menutupi persis balok
          sebelahnya, dan di papan sepadat ini itu berarti menutupi jawabannya.
        */}
        <div className="stg-readout" role="status" aria-live="polite">
          {reading.kind === 'block' ? (
            <div className="stg-readout-body" data-div={reading.division.code} key={reading.block.key}>
              <span className="stg-readout-div">{reading.division.name}</span>
              <strong>{reading.block.name}</strong>
              <span className="stg-readout-when">{reading.block.scheduleLabel}</span>
              <p>{reading.block.desc}</p>
              {reading.block.repeatCount > 1 ? (
                <span className="stg-readout-note">
                  Berulang {reading.block.repeatCount} kali dalam setahun
                </span>
              ) : null}
            </div>
          ) : (
            <div className="stg-readout-body stg-readout-idle">
              <span className="stg-readout-div">Papan tahun {year}</span>
              <strong>{drawnBlocks} penanda di papan</strong>
              <p>
                Program yang jatuh di bulan tertentu digambar sebagai balok. {ambientCount} program
                berjalan sepanjang dua belas bulan
                {deferredCount > 0 ? ` dan ${deferredCount} belum punya bulan` : ''}, jadi keduanya
                didaftar sebagai pil di bawah papan.
              </p>
            </div>
          )}
        </div>

        <div className="stg-scroll">
          <div
            className="stg-field"
            ref={fieldRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setSweep(null)}
          >
            <div className="stg-grid" aria-hidden="true">
              {MONTH_NAMES_SHORT.map((month) => (
                <i key={month} />
              ))}
            </div>

            {sweep !== null ? (
              <div className="stg-sweep" style={{ left: `${sweep * 100}%` }} aria-hidden="true">
                <b>{sweepMonth ? MONTH_NAMES_LONG[sweepMonth - 1] : ''}</b>
              </div>
            ) : null}

            {now !== null ? (
              <div className="stg-now" style={{ left: `${now * 100}%` }} aria-hidden="true">
                <b>Hari ini</b>
              </div>
            ) : null}

            <ol className="stg-rows">
              {rows.map((row, rowIndex) => (
                <StageRowView key={row.division.code} row={row} rowIndex={rowIndex} onRead={setReading} />
              ))}
            </ol>

            <ol className="stg-axis" aria-hidden="true">
              {MONTH_NAMES_SHORT.map((month, index) => (
                <li key={month} data-passed={now !== null && now > (index + 1) / 12}>
                  {month}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/*
          Dua kelompok yang tidak punya tempat di sumbu waktu, dan alasannya
          berbeda. Yang pertama karena tempatnya seluruh sumbu, yang kedua
          karena tempatnya belum ditetapkan. Keduanya tetap harus bisa diklik:
          kalau tidak, dua puluh sekian program cuma bisa ditemukan lewat
          katalog di bawah dan papan ini jadi setengah jujur.
        */}
        {ambientCount > 0 ? (
          <StageChips
            label={`Berjalan tiap bulan · ${ambientCount}`}
            note="Tidak digambar di papan karena tempatnya bukan satu bulan, melainkan semua."
            items={rows.flatMap((row) =>
              row.ambient.map((item) => ({ ...item, code: row.division.code })),
            )}
          />
        ) : null}

        {deferredCount > 0 ? (
          <StageChips
            label={`Belum punya bulan · ${deferredCount}`}
            note="Menunggu pengurus bidangnya menetapkan jadwal lewat panel."
            items={rows.flatMap((row) =>
              row.deferred.map((item) => ({ ...item, code: row.division.code })),
            )}
          />
        ) : null}
      </div>
    </section>
  )
}

function StageChips({
  label,
  note,
  items,
}: {
  label: string
  note: string
  items: Array<StageAmbient & { code: DivisionCode }>
}) {
  return (
    <div className="stg-chips">
      <div className="stg-chips-head">
        <span>{label}</span>
        <small>{note}</small>
      </div>
      <ul>
        {items.map((item) => (
          <li key={`${item.code}-${item.name}`} data-div={item.code}>
            <Link href={item.href}>
              <i aria-hidden="true" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StageRowView({
  row,
  rowIndex,
  onRead,
}: {
  row: StageRow
  rowIndex: number
  onRead: (reading: Reading) => void
}) {
  const height = row.laneCount * LANE_HEIGHT + (row.laneCount - 1) * LANE_GAP

  return (
    <li
      className="stg-row"
      data-div={row.division.code}
      style={
        {
          '--lanes': row.laneCount,
          '--row-h': `${height}px`,
          '--row-delay': `${rowIndex * 70}ms`,
        } as React.CSSProperties
      }
    >
      <span className="stg-row-label">
        <b>{row.division.shortName}</b>
        <small>{row.total} program</small>
        {row.ambient.length > 0 ? <em>+{row.ambient.length} rutin</em> : null}
      </span>

      {/*
        Program yang berjalan dua belas bulan penuh TIDAK digambar di papan sama
        sekali, dan itu keputusan yang sudah dua kali direvisi.

        Sebagai balok penuh, sebelas dari tiga puluh tujuh program menutupi
        seluruh papan dan menghapus bentuk tahunnya. Sebagai arsiran setinggi
        baris, lima dari delapan baris berubah jadi bidang bergaris dan balok
        yang lain tenggelam. Sebagai garis di dasar baris, ia terbaca sebagai
        pemisah baris, dan begitu itu terjadi papannya berubah jadi tabel.

        Yang tersisa dan benar: sebutkan jumlahnya di label barisnya, dan
        daftarkan namanya sebagai pil di bawah papan. Program yang berjalan tiap
        bulan memang tidak punya tempat di sumbu waktu, karena tempatnya adalah
        seluruh sumbu.
      */}
      <div className="stg-lanes">

        {row.blocks.map((block) => (
          <Link
            className="stg-block"
            key={block.key}
            href={block.href}
            data-precision={block.precision}
            data-label={block.repeatIndex === 0 ? block.labelPlacement : 'repeat'}
            data-featured={block.featured || undefined}
            style={
              {
                '--from': block.from,
                '--to': block.to,
                '--lane': block.lane,
                '--block-delay': `${rowIndex * 70 + Math.round(block.from * 420)}ms`,
              } as React.CSSProperties
            }
            onPointerEnter={() => onRead({ kind: 'block', block, division: row.division })}
            onPointerLeave={() => onRead({ kind: 'idle' })}
            onFocus={() => onRead({ kind: 'block', block, division: row.division })}
            onBlur={() => onRead({ kind: 'idle' })}
          >
            {/*
              Program yang berulang beberapa kali setahun hanya diberi nama di
              kemunculan pertamanya. Menulis "Bank Soal" empat kali di satu
              baris yang sama tidak menambah satu pun keterangan, dan barisnya
              berubah jadi pengulangan kata.
            */}
            <span className="stg-block-name" aria-hidden="true">
              {block.repeatIndex === 0 ? block.name : `${block.repeatIndex + 1}`}
            </span>
            <span className="sr-only">
              {block.name}, {row.division.name}, {block.scheduleLabel}
            </span>
          </Link>
        ))}
      </div>
    </li>
  )
}
