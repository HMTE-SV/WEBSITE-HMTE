import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { getPublishedPublicData, getPublishedPublicDataBySlug } from '@/lib/public-data-data'
import { publicDataResourceKindLabels } from '@/lib/public-data'

export const revalidate = 300

type PublicDataDetailPageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const entries = await getPublishedPublicData().catch(() => [])
  return entries.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: PublicDataDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const entry = await getPublishedPublicDataBySlug(slug).catch(() => null)
  if (!entry) return { title: 'Data tidak ditemukan' }
  return { title: `${entry.title} | Data HMTE`, description: entry.excerpt }
}

export default async function PublicDataDetailPage({ params }: PublicDataDetailPageProps) {
  const { slug } = await params
  const entry = await getPublishedPublicDataBySlug(slug)
  if (!entry) notFound()
  const showDataMeta = entry.showDataMeta !== false

  return (
    <PublicPageFrame activeHref="/data">
      <article className="data-detail">
        <header className="data-detail-hero">
          <div className="public-shell">
            <Link className="data-detail-back" href="/data"><span aria-hidden="true">←</span> Kembali ke pusat data</Link>
            <div className="data-detail-heading">
              <div><span>{entry.categoryLabel}</span>{entry.period ? <b>{entry.period}</b> : null}</div>
              <h1>{entry.title}</h1>
              <p>{entry.excerpt}</p>
            </div>
          </div>
        </header>

        <section className="data-detail-content">
          <div className={`public-shell data-detail-layout${showDataMeta ? '' : ' data-detail-layout--without-meta'}`}>
            {showDataMeta ? (
              <aside className="data-detail-meta" aria-label="Informasi data">
                <div className="data-detail-meta-heading">
                  <span>Informasi data</span>
                  <b aria-hidden="true">i</b>
                </div>
                <dl>
                  <div><dt>Kategori</dt><dd>{entry.categoryLabel}</dd></div>
                  <div><dt>Periode</dt><dd>{entry.period || 'Tidak terikat periode'}</dd></div>
                  <div><dt>Pembaruan</dt><dd>{entry.publishedLabel}</dd></div>
                  <div><dt>Resource</dt><dd>{entry.resources.length} sumber</dd></div>
                  <div><dt>Akses</dt><dd><span className="data-detail-access-dot" aria-hidden="true" /> Publik</dd></div>
                </dl>
                <p>Gunakan data sesuai konteks yang dijelaskan pengelola. Tautan dapat diperbarui secara berkala.</p>
              </aside>
            ) : null}
            <div className="data-detail-copy">
              <div className="article-rich-content" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
            </div>
          </div>
        </section>

        <section className="data-detail-resources" aria-labelledby="data-resources-title">
          <div className="public-shell">
            <div className="data-detail-resources-head"><div><span>Lampiran dan sumber</span><h2 id="data-resources-title">Resource yang dapat diakses</h2></div><b>{entry.resources.length.toString().padStart(2, '0')}</b></div>
            {entry.resources.length === 0 ? <p className="data-detail-no-resource">Belum ada resource terhubung pada halaman ini.</p> : (
              <div className="data-detail-resource-list">
                {entry.resources.map((resource, index) => (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.id}>
                    <span className="data-detail-resource-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="data-detail-resource-copy"><small>{publicDataResourceKindLabels[resource.kind]}{resource.format ? ` · ${resource.format}` : ''}</small><h3>{resource.label}</h3><p>{resource.description || 'Buka resource pada sumber resminya.'}</p></div>
                    <strong>{resource.kind === 'spreadsheet' ? 'Buka spreadsheet' : resource.kind === 'file' ? 'Buka berkas' : 'Kunjungi tautan'} <b aria-hidden="true">↗</b></strong>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </article>
    </PublicPageFrame>
  )
}
