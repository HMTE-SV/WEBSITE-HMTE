'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { getLeaderHref } from '@/lib/organization-slugs'
import { getRoleClass } from '@/lib/roles'
import { useDirectory } from './directory/DirectoryProvider'

export function MemberDetailModal() {
  const { activeMember, closeMember } = useDirectory()
  const isOpen = activeMember !== null
  const windowRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    // Remember what had focus, move focus into the dialog, and trap Tab inside it.
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMember()
        return
      }

      if (event.key !== 'Tab' || !windowRef.current) {
        return
      }

      const focusable = windowRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocused.current?.focus()
    }
  }, [isOpen, closeMember])

  const leader = activeMember?.leader
  const hasSocials = Boolean(leader?.instagram || leader?.linkedin || leader?.email)

  return (
    <div
      className={isOpen ? 'os-modal-backdrop active' : 'os-modal-backdrop'}
      role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen ? true : undefined}
      aria-labelledby={isOpen ? 'modalName' : undefined}
      aria-hidden={isOpen ? undefined : true}
      inert={!isOpen}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeMember()
        }
      }}
    >
      <div className="os-modal-window" ref={windowRef}>
        <div className="os-modal-header">
          <div className="os-modal-context" aria-hidden="true">
            {activeMember?.divisionCode ?? 'HMTE'}
          </div>
          <div className="os-modal-title">Info Pengurus</div>
          <button
            ref={closeButtonRef}
            type="button"
            className="os-modal-close-btn"
            aria-label="Tutup dialog"
            onClick={closeMember}
          >
            &times;
          </button>
        </div>
        <div className="os-modal-body">
          {leader && activeMember ? (
            <div className="member-detail-layout">
              <div className="detail-left">
                <div className="detail-avatar">
                  {leader.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leader.photo} alt={leader.name} />
                  ) : (
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </div>
                <span className={`detail-badge ${getRoleClass(leader.role)}`}>{leader.role}</span>
              </div>
              <div className="detail-right">
                <h3 className="detail-name" id="modalName">
                  {leader.name}
                </h3>
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Bidang</span>
                    <span className="meta-val">{activeMember.divisionName}</span>
                  </div>
                  {leader.batch ? (
                    <div className="meta-item">
                      <span className="meta-label">Angkatan</span>
                      <span className="meta-val">{leader.batch}</span>
                    </div>
                  ) : (
                    <div className="meta-item">
                      <span className="meta-label">Peran</span>
                      <span className="meta-val">{leader.role}</span>
                    </div>
                  )}
                </div>
                <div className="detail-bio">
                  <h4>Bio Organisasi</h4>
                  <p>{leader.bio || `Profil ${leader.name} akan dilengkapi bersama data resmi pengurus HMTE.`}</p>
                </div>
                <Link className="detail-profile-link" href={getLeaderHref(leader)}>
                  Buka profil lengkap
                </Link>
                {hasSocials ? (
                  <div className="detail-socials">
                    <h4>Hubungi Pengurus</h4>
                    <div className="social-links">
                      {leader.instagram ? (
                        <a
                          href={`https://instagram.com/${leader.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Instagram ${leader.name}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </a>
                      ) : null}
                      {leader.linkedin ? (
                        <a
                          href={`https://linkedin.com/in/${leader.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`LinkedIn ${leader.name}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                          </svg>
                        </a>
                      ) : null}
                      {leader.email ? (
                        <a href={`mailto:${leader.email}`} aria-label={`Email ${leader.name}`}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
