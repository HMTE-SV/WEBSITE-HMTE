import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { divisionVisuals } from '@/data/organization-presentation'
import { getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref } from '@/lib/organization-slugs'

export const metadata: Metadata = {
  title: 'Pengurus Harian dan Departemen HMTE TRE SV UGM',
  description: 'Direktori Pengurus Harian dan tujuh departemen Kabinet Abya Vistara.',
}

export default async function DivisionsPage() {
  const { divisionsByCode, leadersByDivision, programsByDivision } = await getOrganizationData()
  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })
  const memberCount = divisions.reduce(
    (total, division) => total + leadersByDivision[division.code].length,
    0,
  )
  const programCount = divisions.reduce(
    (total, division) => total + programsByDivision[division.code].length,
    0,
  )

  return (
    <PublicPageFrame activeHref="/divisi">
      <section
        className="division-index-hero has-hero-backdrop"
        aria-labelledby="divisions-title"
      >
        <HeroBackdrop variant="orbit" />
        <div className="org-shell division-index-hero-grid">
          <div className="division-index-copy">
            <p className="org-context">Kabinet Abya Vistara · 2026/2027</p>
            <h1 id="divisions-title">
              Temukan ruang kerja,
              <span>kenali orangnya.</span>
            </h1>
            <p>
              Delapan unsur organisasi bergerak dalam satu arah. Pilih bidang untuk melihat anggota,
              peran, dan program kerja tanpa harus menelusuri halaman yang panjang.
            </p>
            <dl className="division-index-stats" aria-label="Ringkasan organisasi">
              <div>
                <dt>Unsur</dt>
                <dd>{divisions.length}</dd>
              </div>
              <div>
                <dt>Anggota</dt>
                <dd>{memberCount}</dd>
              </div>
              <div>
                <dt>Program</dt>
                <dd>{programCount}</dd>
              </div>
            </dl>
          </div>

          <figure className="division-index-emblem">
            <Image
              src="/assets/abya-vistara/logo-kabinet.webp"
              alt="Logo Kabinet Abya Vistara"
              width={360}
              height={360}
              priority
            />
            <figcaption>
              <span>Kabinet</span>
              <strong>Abya Vistara</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="division-index-board" aria-labelledby="division-board-title">
        <div className="org-shell">
          <header className="division-index-board-head">
            <div>
              <span>{String(divisions.length).padStart(2, '0')} ruang kerja</span>
              <h2 id="division-board-title">Pilih bidang yang ingin kamu kenali.</h2>
            </div>
            <p>Setiap panel membuka direktori anggota dan agenda bidang terkait.</p>
          </header>

          {/*
            Every unsur gets an identical plate — the board varies by ink/paper
            rhythm and spine labels, never by footprint, so no bidang reads as
            ranked above another.
          */}
          <div className="division-board">
            {divisions.map((division, index) => {
              const leaderCount = leadersByDivision[division.code].length
              const divisionProgramCount = programsByDivision[division.code].length

              return (
                <Link
                  className="division-plate"
                  href={getDivisionHref(division.code)}
                  key={division.code}
                >
                  <Image
                    className="division-plate-texture"
                    src={divisionVisuals[division.code]}
                    alt=""
                    fill
                    sizes="(max-width: 820px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  />
                  <span className="division-plate-spine" aria-hidden="true">
                    {division.shortName}
                  </span>
                  <span className="division-plate-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="division-plate-body">
                    <h3>{division.name}</h3>
                    <p>{division.description}</p>
                    <div className="division-plate-meta">
                      <span>{leaderCount} anggota</span>
                      <span>{divisionProgramCount} program</span>
                      <b aria-hidden="true">↗</b>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </PublicPageFrame>
  )
}
