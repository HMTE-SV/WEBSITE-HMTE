'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getDivisionHref, getLeaderHref } from '@/lib/organization-slugs'
import { getRoleClass } from '@/lib/roles'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import { useDirectory } from './directory/DirectoryProvider'

type LeadershipDirectoryProps = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

function MemberImage({ member }: { member: Leader }) {
  if (member.photo) {
    return <Image src={member.photo} alt={member.name} fill sizes="(max-width: 720px) 42vw, 180px" />
  }

  return (
    <Image
      className="organization-logo-fallback"
      src="/assets/logo-hmte.svg"
      alt=""
      width={96}
      height={44}
    />
  )
}

export function LeadershipDirectory({
  divisions,
  divisionsByCode,
  leadersByDivision,
  programsByDivision,
}: LeadershipDirectoryProps) {
  const { selectedDivision, selectDivision } = useDirectory()
  const division = divisionsByCode[selectedDivision]
  const members = leadersByDivision[selectedDivision] ?? []
  const programs = programsByDivision[selectedDivision] ?? []
  const executive = divisions.find((item) => item.code === 'PH')
  const orderedDivisions = executive
    ? [executive, ...divisions.filter((item) => item.code !== 'PH')]
    : divisions

  return (
    <div className="org-showcase-shell" id="division-showcase">
      <div className="org-showcase-kicker">
        <span>Etalase organisasi</span>
        <span aria-live="polite">{members.length} pengurus</span>
      </div>

      <div className="org-switcher" aria-label="Pilih divisi dari etalase">
        {orderedDivisions.map((item, index) => (
          <button
            type="button"
            className={item.code === selectedDivision ? 'is-active' : undefined}
            key={item.code}
            onClick={() => selectDivision(item.code)}
            aria-pressed={item.code === selectedDivision}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {item.shortName}
          </button>
        ))}
      </div>

      <div className="org-showcase" key={selectedDivision}>
        <header className="org-showcase-head">
          <div>
            <span className="org-showcase-code">{selectedDivision}</span>
            <h3>{division.name}</h3>
          </div>
          <p>{division.description}</p>
        </header>

        <div className="org-showcase-grid">
          <div className="org-member-preview">
            <div className="org-preview-label">
              <span>Kenali timnya</span>
              <span>Pratinjau</span>
            </div>
            <div className="org-member-grid">
              {members.slice(0, 4).map((member) => (
                <Link className="org-member-card" href={getLeaderHref(member)} key={`${member.name}-${member.role}`}>
                  <div className="org-member-photo">
                    <MemberImage member={member} />
                  </div>
                  <div className="org-member-copy">
                    <h4>{member.name}</h4>
                    <span className={getRoleClass(member.role)}>{member.role}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="org-program-preview">
            <div className="org-preview-label">
              <span>Yang dikerjakan</span>
              <span>{programs.length} program</span>
            </div>
            <div className="org-program-list">
              {programs.slice(0, 3).map((program, index) => (
                <div className="org-program-row" key={program.name}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h4>{program.name}</h4>
                    <p>{program.status} · {program.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="org-text-link" href="/program-kerja">
              Jelajahi semua program kerja <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>

        <footer className="org-showcase-footer">
          <p>Butuh susunan lengkap, kontak, dan profil setiap pengurus?</p>
          <div>
            <Link href={`/kepengurusan?divisi=${selectedDivision}`}>Semua pengurus</Link>
            <Link href={getDivisionHref(selectedDivision)}>Profil {division.shortName}</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
