'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { FeaturedProgramPresentation } from '@/data/program-presentations'
import type { Division, Leader, Program, ProgramStatus } from '@/types/content'

type ViewKey = 'ringkasan' | 'timeline' | 'dokumen' | 'tim'

type ProgramDetailWorkspaceProps = {
  division: Division
  leaders: Leader[]
  presentation: FeaturedProgramPresentation
  program: Program
  relatedPrograms: Program[]
  slug: string
}

const views: Array<{ key: ViewKey; label: string; index: string }> = [
  { key: 'ringkasan', label: 'Ringkasan', index: '01' },
  { key: 'timeline', label: 'Timeline', index: '02' },
  { key: 'dokumen', label: 'Dokumen', index: '03' },
  { key: 'tim', label: 'Penanggung jawab', index: '04' },
]

const timelineStateLabels = {
  active: 'Sedang berjalan',
  done: 'Selesai',
  upcoming: 'Berikutnya',
} as const

function getStatusClass(status: ProgramStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

export function ProgramDetailWorkspace({
  division,
  leaders,
  presentation,
  program,
  relatedPrograms,
  slug,
}: ProgramDetailWorkspaceProps) {
  const initialTimeline = Math.max(
    0,
    presentation.timeline.findIndex((item) => item.state === 'active'),
  )
  const [view, setView] = useState<ViewKey>('ringkasan')
  const [selectedTimeline, setSelectedTimeline] = useState(initialTimeline)
  const [selectedFocus, setSelectedFocus] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState(0)
  const [selectedLeader, setSelectedLeader] = useState(0)

  const doneCount = presentation.timeline.filter((item) => item.state === 'done').length
  const readyDocuments = presentation.documents.filter((item) => item.status === 'Tersedia').length
  const progress = Math.round(
    ((doneCount + (presentation.timeline.some((item) => item.state === 'active') ? 0.5 : 0)) /
      presentation.timeline.length) *
      100,
  )
  const activeStage = presentation.timeline[selectedTimeline]
  const activeLeader = leaders[selectedLeader]
  const activeDocument = presentation.documents[selectedDocument]

  const selectTimelineWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()

    if (event.key === 'Home') setSelectedTimeline(0)
    else if (event.key === 'End') setSelectedTimeline(presentation.timeline.length - 1)
    else {
      const direction = event.key === 'ArrowRight' ? 1 : -1
      setSelectedTimeline(
        (index + direction + presentation.timeline.length) % presentation.timeline.length,
      )
    }
  }

  return (
    <>
      <section className="program-workspace-hero">
        <div className="public-shell">
          <div className="program-workspace-breadcrumb">
            <Link href="/program-kerja">Program kerja</Link>
            <span>{division.shortName}</span>
            <span>{slug.replaceAll('-', ' ')}</span>
          </div>

          <div className="program-workspace-hero-grid">
            <div className="program-workspace-intro">
              <div className="program-workspace-kicker">
                <span>Program unggulan</span>
                <strong className={getStatusClass(program.status)}>{program.status}</strong>
              </div>
              <h1>{program.name}</h1>
              <p>{presentation.tagline}</p>
            </div>

            <figure className="program-workspace-visual">
              <Image
                alt={`Dokumentasi ${program.name}`}
                fill
                priority
                sizes="(max-width: 800px) 100vw, 38vw"
                src={presentation.image}
              />
              <figcaption>{division.name}</figcaption>
            </figure>
          </div>

          <dl className="program-workspace-metrics">
            <div><dt>Status</dt><dd>{program.status}</dd></div>
            <div><dt>Periode</dt><dd>{program.date}</dd></div>
            <div><dt>Progres fase</dt><dd>{progress}%</dd></div>
            <div><dt>Dokumen publik</dt><dd>{readyDocuments}/{presentation.documents.length}</dd></div>
            <div><dt>Tim terkait</dt><dd>{leaders.length} orang</dd></div>
          </dl>
        </div>
      </section>

      <section className="program-workspace-section">
        <div className="public-shell">
          <div className="program-workspace-shell">
            <nav className="program-workspace-tabs" aria-label="Informasi program">
              {views.map((item) => (
                <button
                  aria-pressed={view === item.key}
                  className={view === item.key ? 'is-active' : undefined}
                  key={item.key}
                  onClick={() => setView(item.key)}
                  type="button"
                >
                  <span>{item.index}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="program-workspace-content" aria-live="polite">
              {view === 'ringkasan' ? (
                <div className="program-view program-summary-view">
                  <article className="program-summary-copy">
                    <span className="public-label">Tentang program</span>
                    <h2>Satu arah kerja yang dapat dipantau bersama.</h2>
                    <p className="program-summary-lead">{presentation.summary}</p>
                    <p>{program.desc}</p>
                    <Link href={`/divisi/${division.code.toLowerCase()}`}>
                      Kenali {division.name}
                    </Link>
                  </article>

                  <aside className="program-focus-selector">
                    <div className="program-panel-heading">
                      <div><span>Fokus kerja</span><strong>{presentation.focus.length} prioritas</strong></div>
                      <b>{String(selectedFocus + 1).padStart(2, '0')}</b>
                    </div>
                    <div className="program-focus-buttons">
                      {presentation.focus.map((item, index) => (
                        <button
                          aria-pressed={selectedFocus === index}
                          className={selectedFocus === index ? 'is-active' : undefined}
                          key={item}
                          onClick={() => setSelectedFocus(index)}
                          type="button"
                        >
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <strong>{item}</strong>
                        </button>
                      ))}
                    </div>
                    <div className="program-focus-detail" key={selectedFocus}>
                      <span>Prioritas terpilih</span>
                      <h3>{presentation.focus[selectedFocus]}</h3>
                      <p>Fokus ini menjadi salah satu acuan penyelarasan keputusan, jadwal, dan tindak lanjut program.</p>
                    </div>
                  </aside>
                </div>
              ) : null}

              {view === 'timeline' ? (
                <div className="program-view program-timeline-view">
                  <div className="program-view-heading">
                    <div><span className="public-label">Alur pelaksanaan</span><h2>Timeline program</h2></div>
                    <div className="program-progress-summary"><strong>{progress}%</strong><span>{doneCount} dari {presentation.timeline.length} fase selesai</span></div>
                  </div>

                  <div className="program-animated-progress" aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <div className="program-timeline-rail" role="tablist" aria-label="Tahapan program">
                    {presentation.timeline.map((item, index) => (
                      <button
                        aria-selected={selectedTimeline === index}
                        className={`is-${item.state}`}
                        key={`${item.date}-${item.label}`}
                        onClick={() => setSelectedTimeline(index)}
                        onKeyDown={(event) => selectTimelineWithKeyboard(event, index)}
                        role="tab"
                        type="button"
                      >
                        <i aria-hidden="true" />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{item.label}</strong>
                        <time>{item.date}</time>
                        <em>{timelineStateLabels[item.state]}</em>
                      </button>
                    ))}
                  </div>

                  <article className="program-timeline-detail" key={selectedTimeline} role="tabpanel">
                    <div>
                      <span>Fase {String(selectedTimeline + 1).padStart(2, '0')}</span>
                      <strong className={`is-${activeStage.state}`}>
                        {timelineStateLabels[activeStage.state]}
                      </strong>
                    </div>
                    <h3>{activeStage.label}</h3>
                    <p>{activeStage.description}</p>
                    <time>{activeStage.date}</time>
                  </article>
                </div>
              ) : null}

              {view === 'dokumen' ? (
                <div className="program-view program-documents-view">
                  <div className="program-view-heading">
                    <div><span className="public-label">Pusat berkas</span><h2>Dokumen program</h2></div>
                    <p>Pilih dokumen untuk melihat status dan informasi publikasinya.</p>
                  </div>

                  <div className="program-document-browser">
                    <div className="program-document-list">
                      {presentation.documents.map((document, index) => (
                        <button
                          aria-pressed={selectedDocument === index}
                          className={selectedDocument === index ? 'is-active' : undefined}
                          key={document.name}
                          onClick={() => setSelectedDocument(index)}
                          type="button"
                        >
                          <span>{document.format}</span>
                          <div><strong>{document.name}</strong><small>Dokumen {String(index + 1).padStart(2, '0')}</small></div>
                          <em>{document.status}</em>
                        </button>
                      ))}
                    </div>

                    <aside className="program-document-preview" key={selectedDocument}>
                      <span>Dokumen terpilih</span>
                      <b>{activeDocument.format}</b>
                      <h3>{activeDocument.name}</h3>
                      <p>
                        {activeDocument.status === 'Tersedia'
                          ? 'Dokumen telah diverifikasi dan siap dibuka oleh publik.'
                          : 'Dokumen sedang disiapkan dan akan tersedia setelah proses verifikasi pengurus.'}
                      </p>
                      <button disabled={activeDocument.status !== 'Tersedia'} type="button">
                        {activeDocument.status === 'Tersedia' ? 'Buka dokumen' : 'Belum tersedia'}
                      </button>
                    </aside>
                  </div>
                </div>
              ) : null}

              {view === 'tim' ? (
                <div className="program-view program-team-view">
                  <div className="program-view-heading">
                    <div><span className="public-label">Struktur tanggung jawab</span><h2>Tim pelaksana</h2></div>
                    <p>{division.description}</p>
                  </div>

                  <div className="program-team-browser">
                    <div className="program-team-list">
                      {leaders.map((leader, index) => (
                        <button
                          aria-pressed={selectedLeader === index}
                          className={selectedLeader === index ? 'is-active' : undefined}
                          key={`${leader.name}-${leader.role}`}
                          onClick={() => setSelectedLeader(index)}
                          type="button"
                        >
                          <span>{getInitials(leader.name)}</span>
                          <div><strong>{leader.name}</strong><small>{leader.role}</small></div>
                        </button>
                      ))}
                    </div>

                    {activeLeader ? (
                      <aside className="program-leader-detail" key={selectedLeader}>
                        <div>{getInitials(activeLeader.name)}</div>
                        <span>{selectedLeader === 0 ? 'Penanggung jawab utama' : 'Tim pendukung'}</span>
                        <h3>{activeLeader.name}</h3>
                        <p>{activeLeader.role}</p>
                        <dl>
                          <div><dt>Unit</dt><dd>{division.shortName}</dd></div>
                          <div><dt>Program</dt><dd>{program.name}</dd></div>
                        </dl>
                      </aside>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {relatedPrograms.length > 0 ? (
            <section className="program-related-compact">
              <div className="program-view-heading">
                <div><span className="public-label">Masih dari {division.shortName}</span><h2>Program terkait</h2></div>
              </div>
              <div>
                {relatedPrograms.map((relatedProgram, index) => (
                  <article key={relatedProgram.name}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h3>{relatedProgram.name}</h3><p>{relatedProgram.desc}</p></div>
                    <aside><strong className={getStatusClass(relatedProgram.status)}>{relatedProgram.status}</strong><time>{relatedProgram.date}</time></aside>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </>
  )
}
