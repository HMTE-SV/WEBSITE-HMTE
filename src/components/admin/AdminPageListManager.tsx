'use client'

import Link from 'next/link'
import { AdminShell } from './AdminShell'
import { pageDefinitions, pageKeys } from '@/lib/page-content'

export function AdminPageListManager() {
  return (
    <AdminShell
      activeHref="/admin/pages"
      kicker="Page CMS"
      title="Halaman situs"
      description="Kelola copy, urutan section, visibilitas, SEO, dan gambar bernama tanpa mengubah layout publik."
    >
      <section className="admin-page-index-intro">
        <span>Gelombang pertama</span>
        <h2>Editor berbasis struktur halaman.</h2>
        <p>Beranda dan Kontak memakai model editor yang sama. Halaman berikutnya dapat ditambahkan ke registry tanpa membuat ulang alur draft, publish, dan restore.</p>
      </section>
      <div className="admin-page-index-list">
        {pageKeys.map((pageKey, index) => {
          const definition = pageDefinitions[pageKey]
          const mediaCount = definition.sections.reduce((total, section) => total + section.mediaSlotKeys.length, 0)
          return (
            <article key={pageKey}>
              <span className="admin-page-index-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <small>{definition.path}</small>
                <h3>{definition.label}</h3>
                <p>{definition.description}</p>
              </div>
              <dl>
                <div><dt>Section</dt><dd>{definition.sections.length}</dd></div>
                <div><dt>Slot gambar</dt><dd>{mediaCount}</dd></div>
              </dl>
              <Link className="admin-primary-button" href={`/admin/pages/${pageKey}`}>Buka editor</Link>
            </article>
          )
        })}
      </div>
    </AdminShell>
  )
}
