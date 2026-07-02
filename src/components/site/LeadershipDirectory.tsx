'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { isFeaturedProgram } from '@/data/featured-programs'
import { getDivisionHref, getProgramHref } from '@/lib/organization-slugs'
import { getRoleClass } from '@/lib/roles'
import type { Division, DivisionCode, Leader, Program, ProgramStatus } from '@/types/content'
import { useDirectory } from './directory/DirectoryProvider'

type LeadershipDirectoryProps = {
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

type DirectoryMode = 'anggota' | 'proker'
type ViewMode = 'grid' | 'list'

function programStatusClass(status: ProgramStatus) {
  if (status === 'Selesai') return 'confirmed'
  if (status === 'Sedang Berjalan') return 'indicated'
  return 'pending'
}

function MemberAvatarFallback() {
  return (
    <Image className="organization-logo-fallback" src="/assets/logo-hmte.svg" alt="" width={48} height={22} />
  )
}

export function LeadershipDirectory({
  divisionsByCode,
  leadersByDivision,
  programsByDivision,
}: LeadershipDirectoryProps) {
  const { selectedDivision, openMember } = useDirectory()
  const [directoryMode, setDirectoryMode] = useState<DirectoryMode>('anggota')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const division = divisionsByCode[selectedDivision]
  const query = searchQuery.toLowerCase().trim()

  const members = leadersByDivision[selectedDivision] ?? []
  const programs = programsByDivision[selectedDivision] ?? []

  const filteredMembers = members.filter(
    (member) => member.name.toLowerCase().includes(query) || member.role.toLowerCase().includes(query),
  )
  const filteredPrograms = programs.filter(
    (program) => program.name.toLowerCase().includes(query) || program.desc.toLowerCase().includes(query),
  )

  const totalCount = directoryMode === 'anggota' ? members.length : programs.length
  const shownCount = directoryMode === 'anggota' ? filteredMembers.length : filteredPrograms.length
  const countNoun = directoryMode === 'anggota' ? 'Anggota' : 'Program Kerja'
  const chipNoun = directoryMode === 'anggota' ? 'Anggota' : 'Proker'

  function changeMode(mode: DirectoryMode) {
    if (mode === directoryMode) return
    setDirectoryMode(mode)
    setSearchQuery('')
  }

  return (
    <div className="organization-directory">
      <div className="curr-os-wrap">
        <div className="curr-os" aria-label="Direktori Kepengurusan HMTE">
          <div className="os-menubar">
            <div className="os-brand">
              <span className="os-dot"></span>
              Direktori Kepengurusan HMTE
            </div>
            <div className="os-status" id="kepDivLabel" aria-live="polite">
              {selectedDivision} · {totalCount} {countNoun}
            </div>
          </div>
          <div className="os-desktop os-desktop--kep">
            <section className="os-window os-window--kep" aria-live="polite">
              <div className="window-top">
                <div className="workspace-context-mark" aria-hidden="true">HMTE</div>
                <div className="window-title-wrap">
                  <div className="window-title" id="kepWindowTitle">
                    {division ? division.name : selectedDivision}
                  </div>
                  <div className="window-chip">
                    {shownCount} {chipNoun}
                  </div>
                </div>
                <div className="window-actions">
                  <div className="search-box">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="search-icon"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={directoryMode === 'proker' ? 'Cari program kerja...' : 'Cari pengurus...'}
                      aria-label={directoryMode === 'proker' ? 'Cari program kerja' : 'Cari pengurus'}
                    />
                  </div>
                  {directoryMode === 'anggota' ? (
                    <div className="view-toggle" role="group" aria-label="Mode Tampilan">
                      <button
                        type="button"
                        className={viewMode === 'grid' ? 'toggle-btn active' : 'toggle-btn'}
                        aria-pressed={viewMode === 'grid'}
                        onClick={() => setViewMode('grid')}
                        title="Tampilan Grid"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={viewMode === 'list' ? 'toggle-btn active' : 'toggle-btn'}
                        aria-pressed={viewMode === 'list'}
                        onClick={() => setViewMode('list')}
                        title="Tampilan Daftar"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="window-tabs" role="tablist" aria-label="Menu Direktori">
                <button
                  type="button"
                  className={directoryMode === 'anggota' ? 'win-tab active' : 'win-tab'}
                  role="tab"
                  aria-selected={directoryMode === 'anggota'}
                  onClick={() => changeMode('anggota')}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Daftar Anggota
                </button>
                <button
                  type="button"
                  className={directoryMode === 'proker' ? 'win-tab active' : 'win-tab'}
                  role="tab"
                  aria-selected={directoryMode === 'proker'}
                  onClick={() => changeMode('proker')}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Program Kerja
                </button>
              </div>

              {directoryMode === 'anggota' ? (
                <div className={viewMode === 'list' ? 'kep-members-grid list-view' : 'kep-members-grid'}>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <button
                        type="button"
                        className="member-card"
                        key={`${member.name}-${member.role}`}
                        onClick={() =>
                          openMember({
                            leader: member,
                            divisionCode: selectedDivision,
                            divisionName: division ? division.name : selectedDivision,
                          })
                        }
                        aria-label={`Lihat detail ${member.name}`}
                      >
                        <div className="member-avatar">
                          {member.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.photo} alt={member.name} />
                          ) : (
                            <MemberAvatarFallback />
                          )}
                        </div>
                        <div className="member-info">
                          <h4 className="member-name">{member.name}</h4>
                          <span className={`member-role-badge ${getRoleClass(member.role)}`}>{member.role}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="empty-search-state">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="empty-icon"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <p>Tidak ada pengurus yang cocok dengan &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="kep-members-grid">
                  {filteredPrograms.length > 0 ? (
                    filteredPrograms.map((program) => {
                      const featured = isFeaturedProgram(selectedDivision, program.name)

                      return (
                      <div className={featured ? 'proker-card is-featured' : 'proker-card'} key={program.name}>
                        <div className="proker-header">
                          <div>
                            <span className={`status-tag ${programStatusClass(program.status)}`}>{program.status}</span>
                            {featured ? <span className="proker-featured-tag">Unggulan</span> : null}
                          </div>
                          <span className="proker-date">{program.date}</span>
                        </div>
                        <h4 className="proker-title">{program.name}</h4>
                        <p className="proker-desc">{program.desc}</p>
                        {featured ? (
                          <Link className="proker-detail-link" href={getProgramHref(program)}>Buka detail program</Link>
                        ) : null}
                      </div>
                      )
                    })
                  ) : (
                    <div className="empty-search-state">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="empty-icon"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <p>Tidak ada program kerja yang cocok dengan &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
              <div className="workspace-footer-actions">
                <Link href={getDivisionHref(selectedDivision)}>Profil lengkap {division.shortName}</Link>
                <Link
                  href={
                    directoryMode === 'anggota'
                      ? `/kepengurusan?divisi=${selectedDivision}`
                      : `/program-kerja#division-${selectedDivision.toLowerCase()}`
                  }
                >
                  {directoryMode === 'anggota' ? 'Semua pengurus' : 'Semua program kerja'}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
