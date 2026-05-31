'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'
import {
  deleteContentDocument,
  listContentDocuments,
  setContentStatus,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import {
  contentCrudConfigs,
  getContentEditPath,
  getNextPublishStatus,
  type ContentKind,
  type ManagedContentDocument,
} from '@/lib/admin/content-crud'

type AdminContentListPageProps = {
  kind: ContentKind
}

function getDocumentMeta(document: ManagedContentDocument) {
  if ('slug' in document) {
    return document.slug
  }

  return document.date
}

export function AdminContentListPage({ kind }: AdminContentListPageProps) {
  const config = contentCrudConfigs[kind]
  const [documents, setDocuments] = useState<ManagedContentDocument[]>([])
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')

  const loadDocuments = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const nextDocuments = await listContentDocuments<ManagedContentDocument>(config.collectionName)
      setDocuments(nextDocuments)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data.')
    } finally {
      setIsLoading(false)
    }
  }, [config.collectionName])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDocuments()
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [loadDocuments])

  async function handleToggleStatus(document: ManagedContentDocument) {
    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await setContentStatus(config.collectionName, document.id, getNextPublishStatus(document.status))
      setFeedback('Status konten berhasil diperbarui.')
      await loadDocuments()
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status.')
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(document: ManagedContentDocument) {
    const confirmed = window.confirm(`Hapus "${document.title}"? Tindakan ini tidak bisa dibatalkan.`)

    if (!confirmed) {
      return
    }

    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await deleteContentDocument(config.collectionName, document.id)
      setFeedback('Konten berhasil dihapus.')
      await loadDocuments()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus konten.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell
      activeHref={config.basePath}
      description={config.description}
      kicker={config.kicker}
      title={config.title}
    >
      <div className="admin-toolbar">
        <span>{hasFirebaseConfig() ? 'Firestore tersambung' : 'Firebase belum dikonfigurasi'}</span>
        <Link className="admin-primary-button" href={config.newPath}>
          Tambah data
        </Link>
      </div>

      {error ? (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="admin-form-success">{feedback}</p> : null}

      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat membaca dan mengelola konten."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data Firestore..." />
      ) : documents.length === 0 ? (
        <AdminEmptyState body={config.emptyBody} title={config.emptyTitle} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Status</th>
                <th>Info</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.title}</strong>
                    <span>{document.excerpt}</span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${document.status}`}>{document.status}</span>
                  </td>
                  <td>{getDocumentMeta(document)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <Link href={getContentEditPath(kind, document.id)}>Edit</Link>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(document)}
                        disabled={busyId === document.id}
                      >
                        {document.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button type="button" onClick={() => void handleDelete(document)} disabled={busyId === document.id}>
                        Hapus
                      </button>
                    </div>
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
