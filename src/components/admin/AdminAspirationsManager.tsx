'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments, updateContentDocument } from '@/lib/firebase/content-services'
import type { AspirationDocument, AspirationStatus } from '@/types/firestore'

const aspirationStatuses: AspirationStatus[] = [
  'submitted',
  'reviewed',
  'discussed',
  'in_progress',
  'resolved',
  'archived',
]

export function AdminAspirationsManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [items, setItems] = useState<AspirationDocument[]>([])
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')

  const loadItems = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const documents = await listContentDocuments<AspirationDocument>('aspirations')
      setItems(documents)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat aspirasi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadItems()
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [loadItems])

  async function updateAspiration(id: string, data: Partial<AspirationDocument>) {
    setBusyId(id)
    setError('')
    setFeedback('')

    try {
      await updateContentDocument<AspirationDocument>('aspirations', id, data)
      setFeedback('Aspirasi berhasil diperbarui.')
      await loadItems()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Gagal memperbarui aspirasi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell
      activeHref="/admin/aspirations"
      description="Pantau aspirasi mahasiswa, status tindak lanjut, dan catatan internal."
      kicker="Aspirasi"
      title="Inbox aspirasi"
    >
      {error ? (
        <p className="admin-form-error" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="admin-form-success">{feedback}</p> : null}
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat membaca aspirasi dari Firestore."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil aspirasi..." />
      ) : items.length === 0 ? (
        <AdminEmptyState body="Aspirasi masuk akan tampil di sini." title="Belum ada aspirasi." />
      ) : (
        <div className="admin-aspiration-list">
          {items.map((item) => (
            <article className="admin-aspiration-item" key={item.id}>
              <div>
                <span className="admin-status-badge draft">{item.category}</span>
                <h3>{item.isAnonymous ? 'Anonim' : item.senderName || 'Tanpa nama'}</h3>
                <p>{item.message}</p>
                {item.senderEmail && !item.isAnonymous ? <small>{item.senderEmail}</small> : null}
              </div>
              <div className="admin-form-grid">
                <label className="admin-field">
                  Status
                  <select
                    value={item.status}
                    disabled={!canWrite || busyId === item.id}
                    onChange={(event) =>
                      void updateAspiration(item.id, {
                        status: event.target.value as AspirationStatus,
                      })
                    }
                  >
                    {aspirationStatuses.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  Catatan internal
                  <textarea
                    defaultValue={item.internalNotes || ''}
                    disabled={!canWrite}
                    rows={3}
                    onBlur={(event) =>
                      void updateAspiration(item.id, {
                        internalNotes: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
