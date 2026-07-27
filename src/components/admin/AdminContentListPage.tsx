'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import {
  deleteContentDocument,
  subscribeToContentDocuments,
  setContentStatus,
} from '@/lib/firebase/content-services'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import {
  contentCrudConfigs,
  getContentEditPath,
  getNextPublishStatus,
  type ContentKind,
  type ManagedContentDocument,
} from '@/lib/admin/content-crud'
import type { ContentStatus } from '@/types/content'

type AdminContentListPageProps = {
  kind: ContentKind
}

type StatusFilter = ContentStatus | 'all'

const statusLabels: Record<ContentStatus, string> = {
  archived: 'Arsip',
  draft: 'Draft',
  published: 'Terbit',
}

function getDocumentMeta(document: ManagedContentDocument) {
  return 'slug' in document ? `/${document.slug}` : document.date
}

function getDocumentTimestamp(document: ManagedContentDocument) {
  return document.updatedAt?.toDate().getTime() ?? document.createdAt?.toDate().getTime() ?? 0
}

function formatDocumentTimestamp(document: ManagedContentDocument) {
  const timestamp = getDocumentTimestamp(document)

  if (!timestamp) return 'Belum tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function AdminContentListPage({ kind }: AdminContentListPageProps) {
  const config = contentCrudConfigs[kind]
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [documents, setDocuments] = useState<ManagedContentDocument[]>([])
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  /*
   * Langganan, bukan sekali ambil. Redaksi sering bekerja berbarengan, dan
   * status terbit yang diubah satu orang harus langsung terlihat yang lain.
   * `isLoading` sudah lahir dari `hasFirebaseConfig()`, jadi jalur tanpa
   * konfigurasi tidak perlu menyetel apa pun.
   */
  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return
    }

    return subscribeToContentDocuments<ManagedContentDocument>(config.collectionName, {
      onData: (nextDocuments) => {
        setDocuments(
          [...nextDocuments].sort((first, second) => getDocumentTimestamp(second) - getDocumentTimestamp(first)),
        )
        setIsLoading(false)
      },
      onError: (subscribeError) => {
        setError(subscribeError.message || 'Gagal memuat data.')
        setIsLoading(false)
      },
    })
  }, [config.collectionName])

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesStatus = statusFilter === 'all' || document.status === statusFilter
      const matchesSearch =
        !normalizedSearch ||
        document.title.toLowerCase().includes(normalizedSearch) ||
        document.excerpt.toLowerCase().includes(normalizedSearch) ||
        getDocumentMeta(document).toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [documents, searchQuery, statusFilter])

  async function handleToggleStatus(document: ManagedContentDocument) {
    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      const nextStatus = getNextPublishStatus(document.status)
      await setContentStatus(config.collectionName, document.id, nextStatus)
      setFeedback(nextStatus === 'published' ? 'Konten berhasil diterbitkan.' : 'Konten dikembalikan ke draft.')

      if (kind === 'articles') {
        await requestRevalidation('articles')
      }

    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status.')
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(document: ManagedContentDocument) {
    const confirmed = window.confirm(`Hapus "${document.title}"? Tindakan ini tidak bisa dibatalkan.`)

    if (!confirmed) return

    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await deleteContentDocument(config.collectionName, document.id)
      setFeedback('Konten berhasil dihapus.')

      if (kind === 'articles') {
        await requestRevalidation('articles')
      }

    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus konten.')
    } finally {
      setBusyId('')
    }
  }

  const counts = {
    all: documents.length,
    archived: documents.filter((document) => document.status === 'archived').length,
    draft: documents.filter((document) => document.status === 'draft').length,
    published: documents.filter((document) => document.status === 'published').length,
  }

  return (
    <AdminShell activeHref={config.basePath} description={config.description} kicker={config.kicker} title={config.title}>
      <section className="admin-content-overview">
        <div className="admin-content-counts" aria-label="Ringkasan status">
          <span><strong>{counts.all}</strong>Total</span>
          <span><strong>{counts.published}</strong>Terbit</span>
          <span><strong>{counts.draft}</strong>Draft</span>
          <span><strong>{counts.archived}</strong>Arsip</span>
        </div>
        {canWrite ? <Link className="admin-primary-button" href={config.newPath}>+ Tambah {config.label.toLowerCase()}</Link> : null}
      </section>

      <section className="admin-content-controls" aria-label="Filter konten">
        <label className="admin-search-field">
          <span className="sr-only">Cari konten</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Cari ${config.label.toLowerCase()}...`} />
        </label>
        <div className="admin-filter-tabs">
          {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
            <button type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} key={status}>
              {status === 'all' ? 'Semua' : statusLabels[status]}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
      {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}

      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat membaca dan mengelola konten." kicker="Konfigurasi" title="Firebase belum siap." />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data Firestore..." />
      ) : documents.length === 0 ? (
        <AdminEmptyState body={config.emptyBody} title={config.emptyTitle} />
      ) : filteredDocuments.length === 0 ? (
        <AdminEmptyState body="Ubah kata pencarian atau filter status untuk melihat konten lain." kicker="Filter" title="Tidak ada hasil yang cocok." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th scope="col">Konten</th><th scope="col">Status</th><th scope="col">Diperbarui</th><th scope="col">Aksi</th></tr></thead>
            <tbody>
              {filteredDocuments.map((document) => (
                <tr key={document.id}>
                  <td className="admin-content-cell"><small>{getDocumentMeta(document)}</small><strong>{document.title}</strong><p>{document.excerpt}</p></td>
                  <td><span className={`admin-status-badge ${document.status}`}>{statusLabels[document.status]}</span></td>
                  <td><time>{formatDocumentTimestamp(document)}</time></td>
                  <td>
                    {canWrite ? (
                      <div className="admin-table-actions">
                        <Link href={getContentEditPath(kind, document.id)}>Edit</Link>
                        {'slug' in document && document.status === 'published' ? <Link href={`/berita/${document.slug}`} target="_blank" rel="noopener noreferrer">Lihat ↗</Link> : null}
                        <button type="button" onClick={() => void handleToggleStatus(document)} disabled={busyId === document.id}>{document.status === 'published' ? 'Jadikan draft' : 'Terbitkan'}</button>
                        <button className="is-danger" type="button" onClick={() => void handleDelete(document)} disabled={busyId === document.id}>Hapus</button>
                      </div>
                    ) : <span className="admin-readonly-label">Lihat saja</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}
