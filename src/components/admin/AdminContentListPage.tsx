'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminConfirmDialog } from './AdminConfirmDialog'
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

/*
 * Pengumuman dan berita sama-sama memakai halaman editor penuh. Keduanya kini
 * dapat memuat blok kaya dan iframe, sehingga laci singkat tidak lagi cukup.
 */

type AdminContentListPageProps = {
  kind: ContentKind
}

type StatusFilter = ContentStatus | 'all'

const statusLabels: Record<ContentStatus, string> = {
  archived: 'Arsip',
  draft: 'Draft',
  published: 'Terbit',
}

const statusChipVariant: Record<ContentStatus, string> = {
  archived: '',
  draft: 'adm-chip--warn',
  published: 'adm-chip--ok',
}

function getDocumentMeta(document: ManagedContentDocument) {
  return 'slug' in document ? `/${document.slug}` : document.date
}

function getPublicContentPath(kind: ContentKind, document: ManagedContentDocument) {
  if (!('slug' in document)) return ''
  return kind === 'publicData' ? `/data/${document.slug}` : `/berita/${document.slug}`
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
  const [deleteTarget, setDeleteTarget] = useState<ManagedContentDocument | null>(null)

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

      await requestRevalidation(kind)
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status.')
    } finally {
      setBusyId('')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const document = deleteTarget
    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await deleteContentDocument(config.collectionName, document.id)
      setFeedback('Konten berhasil dihapus.')
      setDeleteTarget(null)

      await requestRevalidation(kind)
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

  const primaryAction = !canWrite ? null : (
    <Link className="adm-btn" href={config.newPath}>+ Tambah {config.label.toLowerCase()}</Link>
  )

  return (
    <AdminShell activeHref={config.basePath} title={config.title} actions={primaryAction}>
      <p className="adp-summary">
        <strong>{counts.all}</strong> total · <strong>{counts.published}</strong> terbit · <strong>{counts.draft}</strong> draft · <strong>{counts.archived}</strong> arsip
      </p>

      <div className="adp-toolbar">
        <label className="adp-search">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <span className="sr-only">Cari konten</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Cari ${config.label.toLowerCase()}...`} />
        </label>
        <div className="adp-filters" role="group" aria-label="Saring status">
          {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
            <button type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} key={status}>
              {status === 'all' ? 'Semua' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="adp-inline-error" role="alert">{error}</p> : null}
      {feedback ? <p className="adp-inline-success" role="status">{feedback}</p> : null}

      {!hasFirebaseConfig() ? (
        <AdminEmptyState title="Firebase belum siap." body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat membaca dan mengelola konten." />
      ) : isLoading ? (
        <div className="adp-skeleton-list" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => <div className="adm-skeleton adp-skeleton-row" key={index} />)}
        </div>
      ) : documents.length === 0 ? (
        <AdminEmptyState
          title={config.emptyTitle}
          body={config.emptyBody}
          action={primaryAction}
        />
      ) : filteredDocuments.length === 0 ? (
        <AdminEmptyState title="Tidak ada hasil yang cocok." body="Ubah kata pencarian atau filter status untuk melihat konten lain." />
      ) : (
        <div className="adm-panel">
          {filteredDocuments.map((document) => (
            <div className="adm-row" key={document.id}>
              <div className="adm-row-main">
                <strong>{document.title}</strong>
                <small>{getDocumentMeta(document)} · Diperbarui {formatDocumentTimestamp(document)}</small>
              </div>
              <span className={`adm-chip ${statusChipVariant[document.status]}`.trim()}>{statusLabels[document.status]}</span>
              <div className="adm-row-actions">
                {canWrite ? <Link className="adm-btn adm-btn--ghost" href={getContentEditPath(kind, document.id)}>Edit</Link> : null}
                {'slug' in document && document.status === 'published' ? (
                  <Link className="adm-btn adm-btn--ghost" href={getPublicContentPath(kind, document)} target="_blank" rel="noopener noreferrer">Lihat ↗</Link>
                ) : null}
                {canWrite ? (
                  <button
                    className="adm-btn adm-btn--ghost"
                    type="button"
                    onClick={() => void handleToggleStatus(document)}
                    disabled={busyId === document.id}
                  >
                    {document.status === 'published' ? 'Jadikan draft' : 'Terbitkan'}
                  </button>
                ) : null}
                {canWrite ? (
                  <button
                    className="adm-btn adm-btn--danger"
                    type="button"
                    onClick={() => setDeleteTarget(document)}
                    disabled={busyId === document.id}
                  >
                    Hapus
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget ? (
        <AdminConfirmDialog
          title="Hapus konten?"
          body={`"${deleteTarget.title}" akan dihapus permanen dan tidak bisa dibatalkan.`}
          isBusy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </AdminShell>
  )
}
