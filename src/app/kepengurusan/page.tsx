import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { HeroBackdrop } from '@/components/site/HeroBackdrop'
import { LeadershipIndex } from '@/components/site/LeadershipIndex'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { divisionVisuals } from '@/data/organization-presentation'
import { getOrganizationData } from '@/lib/organization-data'
import { getDivisionHref } from '@/lib/organization-slugs'
import { formatCabinetTitle } from '@/lib/site-settings'
import { getSiteSettings } from '@/lib/site-settings-data'
import type { DivisionCode } from '@/types/content'

/*
 * Satu halaman organisasi, bukan dua.
 *
 * Dulu ada /divisi (papan delapan bidang) dan /kepengurusan (direktori orang),
 * masing-masing dengan hero, logo kabinet, dan menu navigasinya sendiri. Dua
 * pintu ke ruangan yang sama, dan pengunjung yang mencari "siapa Kepala IPTEK"
 * harus menebak yang mana.
 *
 * Sekarang urutannya mengikuti cara orang bertanya: struktur dulu (bidang apa
 * saja yang ada), lalu orangnya (siapa di dalamnya). Rincian tiap bidang tetap
 * di /divisi/[slug]; yang dihapus halaman daftarnya, bukan bidangnya.
 */

export const metadata: Metadata = {
  title: 'Kepengurusan HMTE TRE SV UGM',
  description:
    'Delapan unsur organisasi dan seluruh anggota kepengurusan HMTE TRE SV UGM dalam satu direktori.',
}

type LeadershipPageProps = {
  searchParams: Promise<{ divisi?: string }>
}

export default async function LeadershipPage({ searchParams }: LeadershipPageProps) {
  const [{ divisi }, { divisionsByCode, leadersByDivision, programsByDivision }, settings] =
    await Promise.all([searchParams, getOrganizationData(), getSiteSettings()])

  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })
  const totalLeaders = divisions.reduce(
    (total, division) => total + leadersByDivision[division.code].length,
    0,
  )
  const totalPrograms = divisions.reduce(
    (total, division) => total + programsByDivision[division.code].length,
    0,
  )
  const cabinetTitle = formatCabinetTitle(settings)
  const normalizedDivision = divisi?.toUpperCase()
  // Tanpa ?divisi=, bawaannya menampilkan SEMUA bidang.
  const initialDivision = leadershipDivisionOrder.includes(normalizedDivision as DivisionCode)
    ? (normalizedDivision as DivisionCode)
    : null

  return (
    <PublicPageFrame activeHref="/kepengurusan">
      <section className="soft-surface" aria-labelledby="leadership-title">
        <div className="soft-shell">
          <header className="ppl-hero has-hero-backdrop">
            <HeroBackdrop variant="drift" mesh={false} />
            <div className="ppl-hero-copy">
              <p>
                {cabinetTitle} · {settings.periodLabel}
              </p>
              <h1 id="leadership-title">
                Satu kabinet, <span>{totalLeaders} orang di dalamnya.</span>
              </h1>
              <p className="ppl-hero-lead">
                Delapan unsur organisasi dan seluruh pengurusnya ada di halaman ini. Mulai dari
                bidangnya, atau langsung cari nama dan jabatan.
              </p>
              <dl className="ppl-hero-stats" aria-label="Ringkasan organisasi">
                <div>
                  <dt>Unsur</dt>
                  <dd>{divisions.length}</dd>
                </div>
                <div>
                  <dt>Anggota</dt>
                  <dd>{totalLeaders}</dd>
                </div>
                <div>
                  <dt>Program</dt>
                  <dd>{totalPrograms}</dd>
                </div>
              </dl>
            </div>
            <div className="ppl-hero-mark">
              <Image
                src="/assets/abya-vistara/logo-kabinet.webp"
                alt={`Logo ${cabinetTitle}`}
                width={160}
                height={160}
                priority
              />
            </div>
          </header>

          <section className="division-index-board" aria-labelledby="division-board-title">
            <header className="division-index-board-head">
              <div>
                <span>{String(divisions.length).padStart(2, '0')} ruang kerja</span>
                <h2 id="division-board-title">Mulai dari bidangnya.</h2>
              </div>
              <p>Setiap panel membuka anggota dan agenda bidang terkait.</p>
            </header>

            {/*
              Setiap unsur mendapat plat yang sama besar. Papan ini bervariasi
              lewat warna dan label, tidak pernah lewat ukuran, supaya tidak ada
              bidang yang terbaca lebih tinggi kedudukannya daripada yang lain.
            */}
            <div className="division-board">
              {divisions.map((division, index) => (
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
                      <span>{leadersByDivision[division.code].length} anggota</span>
                      <span>{programsByDivision[division.code].length} program</span>
                      <b aria-hidden="true">↗</b>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <LeadershipIndex
            divisions={divisions}
            leadersByDivision={leadersByDivision}
            initialDivision={initialDivision}
          />
        </div>
      </section>
    </PublicPageFrame>
  )
}
