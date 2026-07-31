import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { getDivisionHref, getLeaderHref, getProgramHref } from '@/lib/organization-slugs'
import {
  isExternalResource,
  normalizeProgramCoordinators,
  normalizeProgramObjectives,
  normalizeProgramResources,
  normalizeProgramTimeline,
} from '@/lib/program-detail'
import {
  buildProgramSchedule,
  formatScheduleShort,
  MONTH_NAMES_SHORT,
} from '@/lib/program-schedule'
import type { Division, Leader, Program } from '@/types/content'

/*
 * Halaman rincian satu program kerja.
 *
 * Versi sebelumnya adalah hero berfoto plus tiga kartu: ringkasan, kalender,
 * dan sidebar navigasi. Fotonya diambil dari dokumentasi kegiatan lain dan
 * tidak satu pun benar-benar memotret program yang dijanjikan judulnya, dan
 * isinya cuma berisi untuk tiga program unggulan karena teksnya ditulis sebagai
 * konstanta di dalam repo.
 *
 * Sekarang: satu halaman padat tanpa satu pun foto. Latarnya bidang abstrak
 * yang sama dengan hero halaman lain, dan seluruh isinya (ringkasan, poin
 * fokus, tahapan, berkas, penanggung jawab) datang dari dokumen Firestore yang
 * bisa disunting pengurus bidangnya sendiri lewat panel.
 *
 * Bagian yang kosong tidak digambar sama sekali. Kartu kosong berjudul "Berkas"
 * memberi tahu pengunjung bahwa ada sesuatu yang hilang, padahal yang benar
 * adalah program itu memang tidak punya berkas.
 */

type ProgramDetailWorkspaceProps = {
  division: Division
  leaders: Leader[]
  program: Program
  relatedPrograms: Program[]
  year: number
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.at(-1)?.[0] ?? ''}`.toUpperCase()
}

/** Baris kosong memisahkan paragraf, seperti yang diketik pengurus di panel. */
function toParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export function ProgramDetailWorkspace({
  division,
  leaders,
  program,
  relatedPrograms,
  year,
}: ProgramDetailWorkspaceProps) {
  /*
   * Dinormalkan di sini, bukan dipercaya apa adanya, karena data ini bisa
   * datang dari dua jalur: dokumen Firestore yang sudah lewat organization-data,
   * dan seed lokal src/data/programs.ts yang ditulis tangan. Yang kedua tidak
   * pernah menyentuh normalizer mana pun.
   */
  const summaryParagraphs = toParagraphs(program.summary || '')
  const objectives = normalizeProgramObjectives(program.objectives)
  const timeline = normalizeProgramTimeline(program.timeline)
  const resources = normalizeProgramResources(program.resources)
  const coordinators = normalizeProgramCoordinators(program.coordinators)

  const schedule = buildProgramSchedule(program, year)
  const activeMonths = new Set(schedule.months)

  /*
   * Penanggung jawab disimpan sebagai nama, jadi tautannya dibuat dengan
   * mencocokkan nama itu ke pengurus bidang. Yang tidak cocok tetap tampil
   * sebagai nama tanpa tautan: orangnya bisa saja sudah tidak aktif, atau
   * memang bukan pengurus bidang ini. Menyembunyikannya akan menghapus nama
   * yang sengaja dicantumkan pengurus.
   */
  const leadersByName = new Map(
    leaders.map((leader) => [leader.name.trim().toLocaleLowerCase('id-ID'), leader]),
  )
  const responsible = coordinators.map((name) => ({
    name,
    leader: leadersByName.get(name.trim().toLocaleLowerCase('id-ID')),
  }))

  const hasNarrative = summaryParagraphs.length > 0 || objectives.length > 0 || timeline.length > 0

  return (
    <>
      <section className="pgd-band has-hero-backdrop" aria-labelledby="program-title">
        <HeroBackdrop variant="dome" />
        <div className="soft-shell pgd-band-inner">
          <nav className="pgd-crumbs" aria-label="Navigasi program">
            <Link href="/program-kerja">Program kerja</Link>
            <span aria-hidden="true">/</span>
            <Link href={getDivisionHref(division.code)}>{division.shortName}</Link>
          </nav>

          <p className="pgd-kicker">
            {program.featured ? 'Program sorotan' : 'Program bidang'} · {division.name}
          </p>
          <h1 id="program-title">{program.name}</h1>
          <p className="pgd-lead">{program.desc}</p>

          <dl className="pgd-facts" aria-label="Ringkasan program">
            <div>
              <dt>Jadwal</dt>
              <dd>
                <time dateTime={program.startDate || undefined}>{schedule.label}</time>
              </dd>
            </div>
            <div>
              <dt>Pola</dt>
              <dd>{program.status}</dd>
            </div>
            <div>
              <dt>Penanggung jawab</dt>
              <dd>{responsible.length > 0 ? `${responsible.length} orang` : 'Belum ditetapkan'}</dd>
            </div>
            <div>
              <dt>Berkas</dt>
              <dd>{resources.length > 0 ? `${resources.length} tautan` : 'Belum ada'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="soft-surface">
        <div className="soft-shell pgd-grid" data-div={division.code}>
          <div className="pgd-main">
            {summaryParagraphs.length > 0 ? (
              <article className="pgd-block">
                <h2>Tentang program ini</h2>
                {summaryParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </article>
            ) : null}

            {objectives.length > 0 ? (
              <article className="pgd-block">
                <h2>Yang ingin dicapai</h2>
                <ul className="pgd-objectives">
                  {objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            {timeline.length > 0 ? (
              <article className="pgd-block">
                <h2>Tahapan pelaksanaan</h2>
                {/*
                  Nomor di sini bukan hiasan bagian. Tahapan memang berurutan,
                  dan urutannya adalah informasi yang dibutuhkan pembacanya.
                */}
                <ol className="pgd-timeline">
                  {timeline.map((entry, index) => (
                    <li key={`${entry.label}-${index}`}>
                      <span className="pgd-timeline-index" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3>{entry.label}</h3>
                        {entry.when ? <span className="pgd-timeline-when">{entry.when}</span> : null}
                        {entry.detail ? <p>{entry.detail}</p> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ) : null}

            {!hasNarrative ? (
              <article className="pgd-block pgd-block-quiet">
                <h2>Rincian menyusul</h2>
                <p>
                  Program ini sudah tercatat dalam kalender kerja {division.name}, tetapi
                  ringkasan, tahapan, dan berkasnya belum diisi pengurus bidang. Yang sudah pasti
                  hanya jadwalnya, dan itu ada di panel sebelah.
                </p>
              </article>
            ) : null}
          </div>

          <aside className="pgd-rail">
            {responsible.length > 0 ? (
              <section className="pgd-card">
                <h2>Penanggung jawab</h2>
                <ul className="pgd-people">
                  {responsible.map(({ name, leader }) => {
                    const body = (
                      <>
                        <span className="pgd-avatar" aria-hidden="true">
                          {getInitials(name)}
                        </span>
                        <span className="pgd-people-copy">
                          <strong>{name}</strong>
                          <small>{leader?.role ?? division.shortName}</small>
                        </span>
                      </>
                    )

                    return (
                      <li key={name}>
                        {leader ? (
                          <Link className="pgd-person" href={getLeaderHref(leader)}>
                            {body}
                            <span className="pgd-person-chev" aria-hidden="true">
                              ›
                            </span>
                          </Link>
                        ) : (
                          <span className="pgd-person pgd-person-plain">{body}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            {resources.length > 0 ? (
              <section className="pgd-card">
                <h2>Berkas dan tautan</h2>
                <ul className="pgd-files">
                  {resources.map((resource) => {
                    const external = isExternalResource(resource.url)

                    return (
                      <li key={resource.url}>
                        <a
                          href={resource.url}
                          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        >
                          <span>
                            <strong>{resource.label}</strong>
                            {resource.note ? <small>{resource.note}</small> : null}
                          </span>
                          <b aria-hidden="true">{external ? '↗' : '→'}</b>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}

            <section className="pgd-card">
              <h2>Kapan berlangsung</h2>
              <p className="pgd-schedule-label">{schedule.label}</p>
              <ol className="pgd-months" aria-label={`Bulan pelaksanaan: ${schedule.label}`}>
                {MONTH_NAMES_SHORT.map((month, index) => (
                  <li key={month} data-active={activeMonths.has(index + 1)}>
                    {month}
                  </li>
                ))}
              </ol>
              <p className="pgd-schedule-note">
                {schedule.precision === 'exact'
                  ? `Tanggal sudah pasti, ${schedule.dayCount} hari.`
                  : schedule.precision === 'planned'
                    ? 'Baru bulan rencana dari kalender kerja. Tanggal pastinya menyusul.'
                    : 'Belum ada bulan maupun tanggal yang ditetapkan.'}
              </p>
              <Link className="pgd-card-link" href="/agenda">
                Lihat papan agenda {year} <span aria-hidden="true">→</span>
              </Link>
            </section>

            {relatedPrograms.length > 0 ? (
              <section className="pgd-card">
                <h2>Program lain di {division.shortName}</h2>
                <ul className="pgd-related">
                  {relatedPrograms.slice(0, 6).map((related) => (
                    <li key={related.name}>
                      <Link href={getProgramHref(related)}>
                        <strong>{related.name}</strong>
                        <small>{formatScheduleShort(buildProgramSchedule(related, year))}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className="pgd-card-link" href={getDivisionHref(division.code)}>
                  Kenali {division.shortName} <span aria-hidden="true">→</span>
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  )
}
