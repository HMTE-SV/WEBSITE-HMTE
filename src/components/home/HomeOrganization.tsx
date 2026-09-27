'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DirectoryProvider, useDirectory } from '@/components/site/directory/DirectoryProvider'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'
import { usePageSection } from '@/components/site/PageContentProvider'
import { useSiteSettings } from '@/components/site/SiteSettingsProvider'
import { organizationRolesByDivision } from '@/data/organization-roles'
import { interpolatePageText } from '@/lib/page-content'
import { getDivisionHref, getLeaderHref } from '@/lib/organization-slugs'
import { formatCabinetTitle } from '@/lib/site-settings'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { ArrowIcon, ChevronIcon } from './HomeMotion'

type HomeOrganizationProps = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

export function HomeOrganization(props: HomeOrganizationProps) {
  const { fields } = usePageSection('organization')
  const settings = useSiteSettings()

  return (
    <DirectoryProvider>
      <section className="av-sec av-org" id="pillars" aria-labelledby="av-org-title">
        <div className="av-frame av-grid">
          <header className="av-box av-box--aurora av-title av-org-title" data-reveal="">
            <h2 id="av-org-title">
              {fields.title}{' '}
              <span className="av-display-blue">{fields.mutedTitle.trim()}</span>.
            </h2>
            <div className="av-title-foot">
              <p className="av-lead">{interpolatePageText(fields.lead, { cabinet: formatCabinetTitle(settings) })}</p>
              <p className="av-context">
                {fields.kicker} · {props.divisions.length} unsur
              </p>
              <Link className="av-link" href="/kepengurusan">
                {fields.action}
                <ArrowIcon />
              </Link>
            </div>
          </header>
          <Channels {...props} />
        </div>
      </section>
    </DirectoryProvider>
  )
}

/*
 * Delapan unsur kabinet sebagai kanal identik: di desktop papan 4×2 di
 * samping judul, di HP satu baris geser. Kanal terpilih dibuka di rincian
 * di bawahnya. Di HP pengurus dan program kerja berbagi satu kotak lewat
 * sakelar, supaya rinciannya tidak memanjang dua kali lipat.
 */
function Channels({ divisions, divisionsByCode, leadersByDivision, programsByDivision }: HomeOrganizationProps) {
  const { selectedDivision, selectDivision } = useDirectory()
  const logo = useMediaSlot('brand.logo.primary')
  const railRef = useRef<HTMLDivElement>(null)
  const [pane, setPane] = useState<'people' | 'programs'>('people')
  const executive = divisions.find((division) => division.code === 'PH')
  const ordered = executive ? [executive, ...divisions.filter((division) => division.code !== 'PH')] : divisions
  const division = divisionsByCode[selectedDivision]
  const members = leadersByDivision[selectedDivision] ?? []
  const programs = programsByDivision[selectedDivision] ?? []
  const roles = organizationRolesByDivision[selectedDivision] ?? []

  // Kanal terpilih dibawa ke tengah barisnya bila baris itu bergulir (HP).
  useEffect(() => {
    const rail = railRef.current
    if (!rail || rail.scrollWidth <= rail.clientWidth) return
    const chip = rail.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!chip) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollTo({ left: chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' })
  }, [selectedDivision])

  // Satu bidang hilang dari data tidak boleh menjatuhkan seluruh beranda.
  if (!division) return null

  return (
    <>
      <div className="av-channel-rail" ref={railRef} role="group" aria-label="Pilih Pengurus Harian atau departemen">
        {ordered.map((item) => {
          const active = item.code === selectedDivision
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={active}
              className={active ? 'av-channel is-active' : 'av-channel'}
              onClick={() => selectDivision(item.code)}
            >
              <span className="av-channel-dot" aria-hidden="true" />
              <strong>{item.shortName}</strong>
              <small>{item.name}</small>
            </button>
          )
        })}
      </div>

      <article className="av-division" key={selectedDivision} aria-live="polite" data-pane={pane}>
        <header className="av-box av-box--deep av-division-head">
          <h3>{division.name}</h3>
          <p>{division.description}</p>
          <div className="av-actions">
            <Link className="av-btn av-btn--light" href={`/kepengurusan?divisi=${selectedDivision}`}>
              <strong>{members.length > 0 ? 'Semua pengurus' : 'Struktur lengkap'}</strong>
              <ArrowIcon />
            </Link>
            <Link className="av-btn av-btn--glass" href={getDivisionHref(selectedDivision)}>
              <strong>Profil {division.shortName}</strong>
              <ArrowIcon />
            </Link>
          </div>
        </header>

        <div className="av-division-switch" role="group" aria-label="Tampilkan rincian">
          <button type="button" aria-pressed={pane === 'people'} onClick={() => setPane('people')}>
            {members.length > 0 ? 'Pengurus' : 'Struktur peran'}
            <span>{members.length > 0 ? members.length : roles.length}</span>
          </button>
          <button type="button" aria-pressed={pane === 'programs'} onClick={() => setPane('programs')}>
            Program kerja
            <span>{programs.length}</span>
          </button>
        </div>

        <div className="av-box av-division-people">
          <p className="av-rows-head">
            {members.length > 0 ? 'Orang-orang di baliknya' : 'Struktur peran'}
            <span>{members.length > 0 ? `${members.length} pengurus` : `${roles.length} kelompok peran`}</span>
          </p>
          {members.length > 0
            ? members.slice(0, 6).map((member, index) => (
                <Link className="av-row av-person" href={getLeaderHref(member)} key={`${member.name}-${member.role}`} style={{ '--i': index } as React.CSSProperties}>
                  <span className="av-avatar">
                    {member.photo ? (
                      <Image src={member.photo} alt="" fill sizes="96px" />
                    ) : (
                      <Image className="av-avatar-logo" src={logo.url} alt="" width={40} height={18} />
                    )}
                  </span>
                  <span className="av-row-text">
                    <strong>{member.name}</strong>
                    <small>{member.role}</small>
                  </span>
                  <ChevronIcon />
                </Link>
              ))
            : roles.slice(0, 6).map((role, index) => (
                <div className="av-row av-person" key={role.name} style={{ '--i': index } as React.CSSProperties}>
                  <span className="av-avatar">
                    <Image className="av-avatar-logo" src={logo.url} alt="" width={40} height={18} />
                  </span>
                  <span className="av-row-text">
                    <strong>{role.name}</strong>
                    <small>Nama pengurus belum tersedia</small>
                  </span>
                </div>
              ))}
        </div>

        <div className="av-box av-box--mist av-division-programs">
          <p className="av-rows-head">
            Program kerja
            <span>{programs.length} program</span>
          </p>
          <ul>
            {programs.slice(0, 3).map((program) => (
              <li key={program.name}>
                <strong>{program.name}</strong>
                <small>{program.status} · {program.date}</small>
              </li>
            ))}
          </ul>
          <Link className="av-link" href="/program-kerja">
            Seluruh program kerja
            <ArrowIcon />
          </Link>
        </div>
      </article>
    </>
  )
}
