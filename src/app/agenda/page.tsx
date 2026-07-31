import type { Metadata } from 'next'
import { AgendaYear, type AgendaEntry } from '@/components/site/AgendaYear'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { getOrganizationData } from '@/lib/organization-data'
import { getProgramHref, toOrganizationSlug } from '@/lib/organization-slugs'
import { MONTH_NAMES_LONG, buildProgramSchedule } from '@/lib/program-schedule'
import { getSiteSettings } from '@/lib/site-settings-data'

/*
 * Jaring pengaman, bukan jalur utama.
 *
 * Jalur normalnya panel memanggil /api/revalidate begitu data berubah, jadi
 * halaman ini segar dalam hitungan detik. Tanpa `revalidate`, halaman ini
 * statis penuh dan panggilan itu jadi SATU-SATUNYA cara menyegarkannya: sekali
 * gagal (token kedaluwarsa, 401, jaringan pengurus putus), halamannya basi
 * sampai deploy berikutnya, bukan sampai lima menit berikutnya.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Agenda HMTE TRE SV UGM',
  description:
    'Peta dua belas bulan program kerja Kabinet Abya Vistara, disaring per bulan dan per bidang.',
}

export default async function AgendaPage() {
  const { divisionsByCode, programsByDivision } = await getOrganizationData()
  const { agendaYear: year } = await getSiteSettings()

  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division
      ? [{ code: division.code, shortName: division.shortName, name: division.name }]
      : []
  })

  const entries: AgendaEntry[] = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    if (!division) return []

    return programsByDivision[code].map((program) => ({
      id: `${code.toLowerCase()}-${toOrganizationSlug(program.name)}`,
      title: program.name,
      desc: program.desc,
      href: getProgramHref(program),
      divisionCode: division.code,
      divisionShort: division.shortName,
      cadence: program.status,
      schedule: buildProgramSchedule(program, year),
    }))
  })

  const scheduled = entries.filter((entry) => entry.schedule.precision !== 'unscheduled')
  const undated = entries.filter((entry) => entry.schedule.precision === 'unscheduled')
  const exactCount = scheduled.filter((entry) => entry.schedule.precision === 'exact').length

  const monthLoad = Array.from(
    { length: 12 },
    (_, index) => scheduled.filter((entry) => entry.schedule.months.includes(index + 1)).length,
  )
  const busiestMonth = MONTH_NAMES_LONG[monthLoad.indexOf(Math.max(...monthLoad))]

  // Bulan yang terbuka duluan adalah bulan berjalan, karena pertanyaan yang
  // paling sering dibawa pengunjung ke halaman ini adalah "sekarang ada apa".
  const now = new Date()
  const currentMonth = now.getUTCFullYear() === year ? now.getUTCMonth() + 1 : null

  return (
    <PublicPageFrame activeHref="/agenda">
      <section className="soft-surface" aria-labelledby="agenda-title">
        <div className="soft-shell">
          <div className="ag-bento">
            <header className="ag-lead has-hero-backdrop">
              <HeroBackdrop variant="orbit" />
              <div className="ag-lead-copy">
                <p>Timeline HMTE · 2026/2027</p>
                <h1 id="agenda-title">
                  Dua belas bulan, <span>dalam satu tatapan.</span>
                </h1>
                <p className="ag-lead-note">
                  Pilih bulan untuk melihat isinya. Program yang tanggalnya sudah ditetapkan
                  tampil dengan tanggalnya; sisanya baru punya bulan rencana dari Buku Panduan.
                </p>
              </div>
            </header>

            <div className="ag-tile sfc">
              <b>{scheduled.length}</b>
              <span>program terjadwal</span>
            </div>
            <div className="ag-tile sfc">
              <b>{exactCount}</b>
              <span>bertanggal pasti</span>
            </div>
            <div className="ag-tile sfc">
              <b>{busiestMonth.slice(0, 3)}</b>
              <span>bulan terpadat</span>
            </div>
          </div>

          {scheduled.length > 0 ? (
            <AgendaYear
              entries={scheduled}
              divisions={divisions}
              initialMonth={currentMonth ?? 1}
              currentMonth={currentMonth}
            />
          ) : (
            <EmptyState
              title="Belum ada agenda"
              body="Agenda resmi akan tampil setelah data dipublikasikan."
            />
          )}

          {undated.length > 0 && (
            <section className="ag-undated sfc">
              <h3>Belum terjadwal</h3>
              <p>
                {undated.length} program belum mencantumkan bulan rencana maupun tanggal, jadi
                belum bisa ditempatkan di peta tahun.
              </p>
              <ul>
                {undated.map((entry) => (
                  <li key={entry.id} data-div={entry.divisionCode}>
                    <span className="soft-tag">{entry.divisionShort}</span>
                    {entry.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>
    </PublicPageFrame>
  )
}
