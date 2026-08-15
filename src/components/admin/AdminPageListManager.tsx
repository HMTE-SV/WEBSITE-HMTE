'use client'

import Link from 'next/link'
import { AdminShell } from './AdminShell'
import { pageDefinitions, pageKeys } from '@/lib/page-content'

/*
 * /admin/pages: daftar baca-saja yang menautkan ke AdminPageEditor per halaman
 * (§7 docs/DESIGN_ADMIN.md). Baris memakai .adm-row, bukan kartu — daftar ini
 * akan bertambah panjang begitu halaman lain ditambahkan ke registry, dan
 * baris rapat tetap terbaca satu pandang sementara kartu longgar tidak.
 */

export function AdminPageListManager() {
  const hasPages = pageKeys.length > 0

  return (
    <AdminShell activeHref="/admin/pages" title="Halaman situs">
      <section className="adm-panel">
        <div className="adm-panel-head">
          <div>
            <h2>Editor berbasis struktur halaman</h2>
            <p>Beranda dan Kontak memakai model editor yang sama — copy, urutan section, visibilitas, SEO, dan gambar bernama tanpa mengubah layout publik.</p>
          </div>
        </div>

        {hasPages ? (
          pageKeys.map((pageKey) => {
            const definition = pageDefinitions[pageKey]
            const mediaCount = definition.sections.reduce((total, section) => total + section.mediaSlotKeys.length, 0)

            return (
              <Link className="adm-row" href={`/admin/pages/${pageKey}`} key={pageKey}>
                <span className="adm-row-main">
                  <strong>{definition.label}</strong>
                  <small>{definition.path} · {definition.sections.length} section · {mediaCount} slot gambar</small>
                </span>
                <span className="adm-chip">Buka editor</span>
              </Link>
            )
          })
        ) : (
          <div className="adm-empty">
            <h3>Belum ada halaman terdaftar</h3>
            <p>Halaman muncul di sini begitu ditambahkan ke registry `pageDefinitions`. Halaman pertama biasanya Beranda atau Kontak.</p>
          </div>
        )}
      </section>
    </AdminShell>
  )
}
