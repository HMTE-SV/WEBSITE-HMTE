import type { Metadata } from 'next'
import { AgendaYear, type AgendaEntry } from '@/components/site/AgendaYear'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { EmptyState, PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { getOrganizationData } from '@/lib/organization-data'
import { getProgramHref, toOrganizationSlug } from '@/lib/organization-slugs'

export const metadata: Metadata = {
  title: 'Agenda HMTE TRE SV UGM',
  description:
    'Peta dua belas bulan program kerja Kabinet Abya Vistara — disaring per bulan dan per bidang.',
}

const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function AgendaPage() {
  const { divisionsByCode, programsByDivision } = await getOrganizationData()

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
      months: program.months ?? [],
      dateLabel: program.date,
    }))
  })

  // A programme with no month cannot be placed on the board at all.
  const scheduled = entries
    .filter((entry) => entry.months.length > 0)
    .sort(
      (first, second) =>
        Math.min(...first.months) - Math.min(...second.months) ||
        first.title.localeCompare(second.title, 'id'),
    )
  const undated = entries.filter((entry) => entry.months.length === 0)

  const monthLoad = Array.from({ length: 12 }, (_, index) =>
    scheduled.filter((entry) => entry.months.includes(index + 1)).length,
  )
  const busiestMonth = MONTHS_LONG[monthLoad.indexOf(Math.max(...monthLoad))]
  const recurring = scheduled.filter((entry) => entry.months.length > 1).length

  return (
    <PublicPageFrame activeHref="/agenda">
      <section
        className="public-atmosphere-hero has-hero-backdrop"
        aria-labelledby="agenda-title"
      >
        <HeroBackdrop variant="orbit" />
        <div className="atmosphere-shell atmosphere-grid">
          <div className="atmosphere-copy">
            <span className="atmosphere-kicker">Timeline HMTE · 2026/2027</span>
            <h1 id="agenda-title">
              Dua belas bulan, <em>dalam satu tatapan.</em>
            </h1>
            <p>
              Setiap program kerja Kabinet Abya Vistara dipetakan ke bulan rencananya.
              Pilih bulan atau bidang untuk mempersempit. Peta ini menunjukkan rencana,
              bukan status realisasi atau tanggal pelaksanaan final.
            </p>
          </div>
          <aside className="atmosphere-aside">
            <p>Seluruh bulan disalin dari timeline resmi pada Buku Panduan HMTE 2026/2027.</p>
            <dl className="atmosphere-stats" aria-label="Ringkasan agenda">
              <div>
                <dt>Program</dt>
                <dd>{String(scheduled.length).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Berulang</dt>
                <dd>{String(recurring).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Terpadat</dt>
                <dd>{busiestMonth.slice(0, 3)}</dd>
              </div>
            </dl>
          </aside>
          <a className="atmosphere-cue" href="#peta-tahun">
            <span>Gulir untuk membuka peta</span>
            <b aria-hidden="true">↓</b>
          </a>
        </div>
      </section>

      <section className="agenda-schedule" id="peta-tahun" aria-labelledby="agenda-schedule-title">
        <div className="public-shell">
          <div className="agenda-schedule-heading">
            <div>
              <span className="public-label gold">Peta tahun</span>
              <h2 id="agenda-schedule-title">Kalender program kerja</h2>
            </div>
            <p>
              Kolom emas menandai bulan aktif sebuah program. Program berkala terbaca
              sebagai deretan tanda yang berulang sepanjang tahun.
            </p>
          </div>

          {scheduled.length > 0 ? (
            <AgendaYear entries={scheduled} divisions={divisions} />
          ) : (
            <EmptyState
              title="Belum ada agenda"
              body="Agenda resmi akan tampil setelah data dipublikasikan."
            />
          )}

          {undated.length > 0 && (
            <div className="agenda-undated">
              <h3>Belum terjadwal</h3>
              <p>
                {undated.length} program belum mencantumkan bulan rencana, jadi tidak bisa
                ditempatkan pada peta di atas.
              </p>
              <ul>
                {undated.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.title}</strong>
                    <span>{entry.divisionShort}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </PublicPageFrame>
  )
}
