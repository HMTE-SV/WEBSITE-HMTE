'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { limit, orderBy } from 'firebase/firestore'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'
import { useAdminSession } from './AdminSessionContext'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { syncMediaSlotProjections } from '@/lib/admin/media-slot-sync'
import {
  listContentDocuments,
  restoreContentRevision,
} from '@/lib/firebase/content-services'
import type {
  AuditAction,
  AuditLogDocument,
  AuditedContentCollectionName,
  ContentRevisionDocument,
} from '@/types/firestore'

const actionLabels: Record<AuditAction, string> = {
  create: 'Dibuat',
  update: 'Diperbarui',
  delete: 'Dihapus',
  restore: 'Dipulihkan',
}

const entityLabels: Record<AuditedContentCollectionName, string> = {
  announcements: 'Pengumuman',
  articles: 'Berita',
  divisions: 'Divisi',
  gallery: 'Galeri',
  leaders: 'Pengurus',
  media: 'Media',
  mediaSlots: 'Slot media',
  pageContents: 'Halaman',
  pageContentDrafts: 'Draf halaman',
  partners: 'Mitra',
  programs: 'Program kerja',
  settings: 'Pengaturan',
  siteSettingsDrafts: 'Draf pengaturan',
}

function formatTimestamp(value: AuditLogDocument['createdAt']) {
  if (!value) return 'Sedang disinkronkan'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Makassar',
  }).format(value.toDate())
}

function formatSnapshot(value: Record<string, unknown> | null) {
  return value ? JSON.stringify(value, null, 2) : 'Tidak ada dokumen'
}

async function revalidateRestoredEntity(entityType: AuditedContentCollectionName) {
  if (entityType === 'articles') return requestRevalidation('articles')
  if (entityType === 'announcements') return requestRevalidation('announcements')
  if (entityType === 'gallery') return requestRevalidation('gallery')
  if (['divisions', 'leaders', 'programs'].includes(entityType)) {
    return requestRevalidation('organization')
  }
  if (entityType === 'settings') {
    return requestRevalidation('settings')
  }
  if (entityType === 'pageContents') {
    return requestRevalidation('pages')
  }
  if (entityType === 'media' || entityType === 'mediaSlots') {
    return requestRevalidation('media')
  }
}

export function AdminHistoryManager() {
  const session = useAdminSession()
  const [entries, setEntries] = useState<AuditLogDocument[]>([])
  const [revisions, setRevisions] = useState<ContentRevisionDocument[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<'all' | AuditAction>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [auditEntries, revisionEntries] = await Promise.all([
        listContentDocuments<AuditLogDocument>('auditLogs', [orderBy('createdAt', 'desc'), limit(100)]),
        listContentDocuments<ContentRevisionDocument>('contentRevisions', [orderBy('createdAt', 'desc'), limit(100)]),
      ])
      setEntries(auditEntries)
      setRevisions(revisionEntries)
      setSelectedId((current) => current || auditEntries[0]?.id || '')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Riwayat perubahan gagal dimuat.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadHistory(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadHistory])

  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('id-ID')
    return entries.filter((entry) => {
      if (action !== 'all' && entry.action !== action) return false
      if (!normalized) return true
      return [entry.summary, entry.entityId, entry.entityType, entry.actorEmail, ...entry.changedFields]
        .join(' ')
        .toLocaleLowerCase('id-ID')
        .includes(normalized)
    })
  }, [action, entries, query])

  const selected = entries.find((entry) => entry.id === selectedId) ?? visibleEntries[0]
  const revision = revisions.find((item) => item.id === selected?.revisionId)

  async function handleRestore() {
    if (!revision || session.role !== 'superadmin') return
    const confirmed = window.confirm(
      `Pulihkan snapshot ${entityLabels[revision.entityType]} “${revision.entityId}”? Perubahan ini akan dicatat sebagai revision baru.`,
    )
    if (!confirmed) return

    setIsRestoring(true)
    setError('')
    setFeedback('')
    try {
      const restored = await restoreContentRevision(revision.id)
      let mediaSyncFailed = false
      if (restored.entityType === 'media') {
        try {
          await syncMediaSlotProjections(restored.entityId)
        } catch {
          mediaSyncFailed = true
        }
      }
      await revalidateRestoredEntity(restored.entityType)
      setFeedback(mediaSyncFailed
        ? 'Snapshot media dipulihkan, tetapi proyeksi slot publik belum tersinkron. Simpan ulang media setelah rules terbaru aktif.'
        : 'Snapshot berhasil dipulihkan dan dicatat sebagai perubahan baru.')
      await loadHistory()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Revision gagal dipulihkan.')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <AdminShell
      activeHref="/admin/history"
      kicker="Audit trail"
      title="Riwayat perubahan"
      description="Jejak create, update, delete, dan restore untuk konten publik. Snapshot privat tidak disimpan di sini."
    >
      <div className="admin-history-toolbar">
        <label>
          <span className="sr-only">Cari riwayat</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari entitas, pelaku, atau field" />
        </label>
        <select value={action} onChange={(event) => setAction(event.target.value as 'all' | AuditAction)} aria-label="Saring aksi">
          <option value="all">Semua aksi</option>
          <option value="create">Dibuat</option>
          <option value="update">Diperbarui</option>
          <option value="delete">Dihapus</option>
          <option value="restore">Dipulihkan</option>
        </select>
        <button className="admin-secondary-button" type="button" onClick={() => void loadHistory()}>
          Muat ulang
        </button>
      </div>

      {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
      {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}

      {isLoading ? (
        <AdminEmptyState kicker="Memuat" title="Mengambil jejak perubahan..." body="Membaca 100 aktivitas terbaru." />
      ) : visibleEntries.length === 0 ? (
        <AdminEmptyState kicker="Riwayat" title="Belum ada perubahan yang cocok." body="Mutasi berikutnya melalui panel akan tercatat otomatis." />
      ) : (
        <div className="admin-history-layout">
          <div className="admin-history-list" role="list">
            {visibleEntries.map((entry) => (
              <button
                type="button"
                className={entry.id === selected?.id ? 'is-active' : undefined}
                onClick={() => setSelectedId(entry.id)}
                key={entry.id}
              >
                <span data-action={entry.action}>{actionLabels[entry.action]}</span>
                <strong>{entityLabels[entry.entityType]} · {entry.entityId}</strong>
                <small>{formatTimestamp(entry.createdAt)} · {entry.actorEmail || entry.actorUid}</small>
              </button>
            ))}
          </div>

          {selected ? (
            <aside className="admin-history-inspector">
              <header>
                <div>
                  <span>{entityLabels[selected.entityType]}</span>
                  <h2>{selected.entityId}</h2>
                </div>
                <b data-action={selected.action}>{actionLabels[selected.action]}</b>
              </header>
              <dl>
                <div><dt>Pelaku</dt><dd>{selected.actorEmail || selected.actorUid}</dd></div>
                <div><dt>Role</dt><dd>{selected.actorRole}</dd></div>
                <div><dt>Waktu</dt><dd>{formatTimestamp(selected.createdAt)}</dd></div>
                <div><dt>Field berubah</dt><dd>{selected.changedFields.join(', ') || '—'}</dd></div>
              </dl>
              {revision ? (
                <div className="admin-history-diff">
                  <section><span>Sebelum</span><pre>{formatSnapshot(revision.before)}</pre></section>
                  <section><span>Sesudah</span><pre>{formatSnapshot(revision.after)}</pre></section>
                </div>
              ) : <p>Snapshot revision tidak ditemukan.</p>}
              {session.role === 'superadmin' && revision ? (
                <button className="admin-primary-button" type="button" disabled={isRestoring} onClick={() => void handleRestore()}>
                  {isRestoring ? 'Memulihkan...' : 'Pulihkan snapshot ini'}
                </button>
              ) : (
                <p className="admin-field-hint">Restore dikunci untuk superadmin. Riwayat tetap dapat dibaca semua admin aktif.</p>
              )}
            </aside>
          ) : null}
        </div>
      )}
    </AdminShell>
  )
}
