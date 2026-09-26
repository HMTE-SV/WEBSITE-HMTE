'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
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
import { LedBoard } from './LedBoard'

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
      <section className="p10-org p10-module" id="pillars" aria-labelledby="p10-org-title">
        <header className="p10-head">
          <h2 id="p10-org-title">
            {fields.title}{' '}
            <span className="p10-display-soft">{fields.mutedTitle.trim()}</span>.
          </h2>
          <Link className="p10-head-action" href="/kepengurusan">
            {fields.action}
            <ArrowIcon />
          </Link>
          <p className="p10-lead">{interpolatePageText(fields.lead, { cabinet: formatCabinetTitle(settings) })}</p>
          <p className="p10-context">
            {fields.kicker} · {props.divisions.length} unsur
          </p>
        </header>
        <Switchboard {...props} />
      </section>
    </DirectoryProvider>
  )
}

function Switchboard({ divisions, divisionsByCode, leadersByDivision, programsByDivision }: HomeOrganizationProps) {
  const { selectedDivision, selectDivision } = useDirectory()
  const logo = useMediaSlot('brand.logo.primary')
  const railRef = useRef<HTMLDivElement>(null)
  const executive = divisions.find((division) => division.code === 'PH')
  const ordered = executive ? [executive, ...divisions.filter((division) => division.code !== 'PH')] : divisions
  const division = divisionsByCode[selectedDivision]
  const members = leadersByDivision[selectedDivision] ?? []
  const programs = programsByDivision[selectedDivision] ?? []
  const roles = organizationRolesByDivision[selectedDivision] ?? []

  // Pil terpilih dibawa ke tengah barisnya bila baris itu bergulir (HP).
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
    <div className="p10-switch">
      <div className="p10-switch-control">
        <div className="p10-board p10-board--division">
          <LedBoard
            scenes={[
              { kind: 'text', text: division.shortName.toUpperCase(), hold: 2600 },
              { kind: 'marquee', text: division.name.toUpperCase(), speed: 34 },
            ]}
            loop
            pitch={4}
            widePitch={6}
          />
        </div>
        <div className="p10-switch-rail" ref={railRef} role="group" aria-label="Pilih Pengurus Harian atau departemen">
          {ordered.map((item) => {
            const active = item.code === selectedDivision
            return (
              <button
                key={item.code}
                type="button"
                aria-pressed={active}
                className={active ? 'is-active' : undefined}
                onClick={() => selectDivision(item.code)}
              >
                <strong>{item.shortName}</strong>
                <small>{item.name}</small>
              </button>
            )
          })}
        </div>
      </div>

      <article className="p10-division" key={selectedDivision} aria-live="polite">
        <header className="p10-division-head">
          <h3>{division.name}</h3>
          <p>{division.description}</p>
        </header>

        <div className="p10-division-grid">
          <div className="p10-division-people">
            <p className="p10-rows-head">
              {members.length > 0 ? 'Orang-orang di baliknya' : 'Struktur peran'}
              <span>{members.length > 0 ? `${members.length} pengurus` : `${roles.length} kelompok peran`}</span>
            </p>
            {members.length > 0
              ? members.slice(0, 6).map((member, index) => (
                  <Link className="p10-row p10-person" href={getLeaderHref(member)} key={`${member.name}-${member.role}`} style={{ '--i': index } as React.CSSProperties}>
                    <span className="p10-avatar">
                      {member.photo ? (
                        <Image src={member.photo} alt="" fill sizes="96px" />
                      ) : (
                        <Image className="p10-avatar-logo" src={logo.url} alt="" width={40} height={18} />
                      )}
                    </span>
                    <span className="p10-row-text">
                      <strong>{member.name}</strong>
                      <small>{member.role}</small>
                    </span>
                    <ChevronIcon />
                  </Link>
                ))
              : roles.slice(0, 6).map((role, index) => (
                  <div className="p10-row p10-person" key={role.name} style={{ '--i': index } as React.CSSProperties}>
                    <span className="p10-avatar">
                      <Image className="p10-avatar-logo" src={logo.url} alt="" width={40} height={18} />
                    </span>
                    <span className="p10-row-text">
                      <strong>{role.name}</strong>
                      <small>Nama pengurus belum tersedia</small>
                    </span>
                  </div>
                ))}
          </div>

          <div className="p10-division-programs">
            <p className="p10-rows-head">
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
            <Link className="p10-link" href="/program-kerja">
              Seluruh program kerja
              <ArrowIcon />
            </Link>
          </div>
        </div>

        <footer className="p10-division-foot">
          <Link className="p10-button p10-button--ghost" href={`/kepengurusan?divisi=${selectedDivision}`}>
            <strong>{members.length > 0 ? 'Semua pengurus' : 'Struktur lengkap'}</strong>
            <ArrowIcon />
          </Link>
          <Link className="p10-button p10-button--ghost" href={getDivisionHref(selectedDivision)}>
            <strong>Profil {division.shortName}</strong>
            <ArrowIcon />
          </Link>
        </footer>
      </article>
    </div>
  )
}
