'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAdminSession } from './AdminSessionContext'
import { canAdminWrite } from '@/data/admin-nav'
import { listContentDocuments } from '@/lib/firebase/content-services'
import type { AnnouncementDocument, ArticleDocument, EventDocument } from '@/types/firestore'

type DashboardCounts = {
  announcements: number
  articles: number
  drafts: number
  events: number
  published: number
}

const emptyCounts: DashboardCounts = { announcements: 0, articles: 0, drafts: 0, events: 0, published: 0 }

export function AdminDashboard() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [counts, setCounts] = useState<DashboardCounts>(emptyCounts)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [articles, announcements, events] = await Promise.all([
        listContentDocuments<ArticleDocument>('articles'),
        listContentDocuments<AnnouncementDocument>('announcements'),
        listContentDocuments<EventDocument>('events'),
      ])

      setCounts({
        announcements: announcements.length,
        articles: articles.length,
        drafts: articles.filter((article) => article.status === 'draft').length,
        events: events.length,
        published: articles.filter((article) => article.status === 'published').length,
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ringkasan Firestore belum dapat dimuat.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadSummary(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadSummary])

  const metrics = [
    { label: 'Total berita', value: counts.articles, note: 'Semua status' },
    { label: 'Sudah terbit', value: counts.published, note: 'Terlihat publik' },
    { label: 'Masih draft', value: counts.drafts, note: 'Perlu ditinjau' },
    { label: 'Agenda & info', value: counts.events + counts.announcements, note: 'Kanal aktif' },
  ]
  const connectionLabel = isLoading
    ? 'Menghubungkan Firestore'
    : error
      ? 'Firestore bermasalah'
      : 'Firestore terhubung'
  const connectionClassName = `admin-live-indicator${isLoading ? ' is-loading' : error ? ' is-error' : ''}`

  return (
    <>
      <section className="admin-dashboard-intro">
        <div>
          <span className={connectionClassName}><i /> {connectionLabel}</span>
          <h2>Selamat datang, {session.displayName || 'Admin HMTE'}.</h2>
          <p>Kelola publikasi dan informasi organisasi dari satu workspace yang sama.</p>
        </div>
        {canWrite ? (
          <div className="admin-dashboard-intro-actions">
            <Link className="admin-primary-button" href="/admin/articles/new">Tulis berita</Link>
            <Link className="admin-secondary-link" href="/admin/articles">Tinjau konten</Link>
          </div>
        ) : null}
      </section>

      {error ? <p className="admin-form-error" role="alert">{error}</p> : null}

      <section className="admin-metric-grid" aria-label="Ringkasan konten">
        {metrics.map((metric, index) => (
          <article className="admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{isLoading ? '—' : metric.value.toString().padStart(2, '0')}</strong>
            <small>{metric.note}</small>
            <i>{String(index + 1).padStart(2, '0')}</i>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-panel">
          <div className="admin-panel-heading">
            <div><span>Alur redaksi</span><h3>Mulai dari sini</h3></div>
            <Link href="/admin/articles">Lihat semua</Link>
          </div>
          <div className="admin-quick-links">
            <Link href="/admin/articles/new"><b>01</b><span><strong>Tulis berita baru</strong><small>Mulai sebagai draft, lalu terbitkan setelah ditinjau.</small></span><i>→</i></Link>
            <Link href="/admin/gallery"><b>02</b><span><strong>Siapkan dokumentasi</strong><small>Simpan referensi gambar dari ImageKit.</small></span><i>→</i></Link>
            <Link href="/admin/announcements"><b>03</b><span><strong>Perbarui pengumuman</strong><small>Jaga informasi singkat tetap relevan.</small></span><i>→</i></Link>
          </div>
        </div>

        <aside className="admin-dashboard-panel admin-access-panel">
          <div className="admin-panel-heading"><div><span>Akses akun</span><h3>{session.role}</h3></div></div>
          <dl>
            <div><dt>Email</dt><dd>{session.email}</dd></div>
            <div><dt>Hak tulis</dt><dd>{canWrite ? 'Aktif' : 'Lihat saja'}</dd></div>
            <div><dt>Verifikasi</dt><dd>adminUsers/{session.uid.slice(0, 8)}…</dd></div>
          </dl>
          <p>Role dibaca langsung dari profil Firestore aktif dan diverifikasi kembali oleh Security Rules.</p>
        </aside>
      </section>
    </>
  )
}
