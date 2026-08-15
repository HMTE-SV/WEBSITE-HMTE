import type { Metadata } from 'next'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getPublishedPublicData } from '@/lib/public-data-data'
import { DataDirectory } from './DataDirectory'

export const metadata: Metadata = {
  title: 'Data Publik | HMTE TRE SV UGM',
  description: 'Pusat data kemahasiswaan, penugasan, akademik, dan organisasi yang dapat diakses bersama.',
}

export const revalidate = 300

export default async function PublicDataPage() {
  const entries = await getPublishedPublicData().catch(() => [])
  const resourceCount = entries.reduce((total, entry) => total + entry.resources.length, 0)
  const categoryCount = new Set(entries.map((entry) => entry.category)).size

  return (
    <PublicPageFrame activeHref="/data">
      <section className="data-hub-hero">
        <div className="public-shell data-hub-hero-grid">
          <div className="data-hub-hero-copy">
            <span>HMTE · Open Data Desk</span>
            <h1>Data yang bisa dipantau, dibaca, dan dipakai bersama.</h1>
            <p>Pusat akses untuk data kemahasiswaan, hasil penugasan, rekap kegiatan, dan spreadsheet kerja yang memang ditujukan bagi banyak orang.</p>
          </div>
          <dl className="data-hub-stats">
            <div><dt>Halaman data</dt><dd>{entries.length.toString().padStart(2, '0')}</dd></div>
            <div><dt>Resource aktif</dt><dd>{resourceCount.toString().padStart(2, '0')}</dd></div>
            <div><dt>Kategori</dt><dd>{categoryCount.toString().padStart(2, '0')}</dd></div>
          </dl>
        </div>
      </section>
      <DataDirectory entries={entries} />
    </PublicPageFrame>
  )
}
