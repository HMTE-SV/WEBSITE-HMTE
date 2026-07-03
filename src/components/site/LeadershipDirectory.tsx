'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getDivisionHref, getLeaderHref } from '@/lib/organization-slugs'
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
    return <Image src={member.photo} alt={member.name} fill sizes="(max-width: 700px) 66vw, 220px" />
  }

  return <Image className="org-person-logo" src="/assets/logo-hmte.svg" alt="" width={96} height={44} />
}

export function LeadershipDirectory({
  divisionsByCode,
  leadersByDivision,
  programsByDivision,
}: LeadershipDirectoryProps) {
  const { selectedDivision } = useDirectory()
  const division = divisionsByCode[selectedDivision]
  const members = leadersByDivision[selectedDivision] ?? []
  const programs = programsByDivision[selectedDivision] ?? []

  return (
    <article className="org-signal" key={selectedDivision} aria-live="polite">
      <header className="org-signal-head">
        <div>
          <span>{division.shortName}</span>
          <h3>{division.name}</h3>
        </div>
        <p>{division.description}</p>
      </header>

      <div className="org-signal-layout">
        <div className="org-signal-people">
          <div className="org-signal-label">
            <strong>Orang-orang di baliknya</strong>
            <span>{members.length} pengurus</span>
          </div>
          <div className="org-people-runway">
            {members.slice(0, 6).map((member, index) => (
              <Link
                className="org-person"
                style={{ '--person-index': index } as React.CSSProperties}
                href={getLeaderHref(member)}
                key={`${member.name}-${member.role}`}
              >
                <div className="org-person-photo">
                  <MemberImage member={member} />
                </div>
                <div>
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="org-signal-programs">
          <div className="org-signal-label">
            <strong>Yang sedang dibangun</strong>
            <span>{programs.length} program</span>
          </div>
          <div className="org-signal-program-list">
            {programs.slice(0, 3).map((program, index) => (
              <div key={program.name}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h4>{program.name}</h4>
                <p>{program.status} · {program.date}</p>
              </div>
            ))}
          </div>
          <Link href="/program-kerja">Seluruh program kerja</Link>
        </aside>
      </div>

      <footer className="org-signal-foot">
        <p>Pindah divisi dari switchboard di atas—tanpa perlu kembali ke section lain.</p>
        <div>
          <Link href={`/kepengurusan?divisi=${selectedDivision}`}>Semua pengurus</Link>
          <Link href={getDivisionHref(selectedDivision)}>Profil {division.shortName}</Link>
        </div>
      </footer>
    </article>
  )
}
