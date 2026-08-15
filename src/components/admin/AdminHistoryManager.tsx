'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { limit, orderBy } from 'firebase/firestore'
import { AdminConfirmDialog } from './AdminConfirmDialog'
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

/*
 * /admin/history: lini masa baca-saja (§7 docs/DESIGN_ADMIN.md).
 *
 * Baris memakai .adm-row, bukan kartu — daftar 100 aktivitas terbaru harus
 * terbaca satu pandang, bukan digulir lewat kartu longgar. Membuka satu entri
 * tidak memakai laci: laci itu untuk MENYUNTING, dan halaman ini tidak pernah
 * menyunting apa pun kecuali tombol restore superadmin. Rincian tampil sebagai
 * panel kedua yang menempel di bawah daftar, supaya tetap bisa dicapai papan
 * ketik berurutan (Tab dari daftar langsung ke rinciannya).
 */

const actionLabels: Record<AuditAction, string> = {
  create: 'Dibuat',
  update: 'Diperbarui',
  delete: 'Dihapus',
  restore: 'Dipulihkan',
}

const actionChipVariant: Record<AuditAction, string> = {
  create: 'adm-chip--ok',
  update: '',
  delete: 'adm-chip--danger',
  restore: 'adm-chip--warn',
}

const entityLabels: Record<AuditedContentCollectionName, string> = {
  announcements: 'Pengumuman',
  articles: 'Berita',
  publicData: 'Data Publik',
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
  if (entityType === 'publicData') return requestRevalidation('publicData')
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
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)
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

  /*
   * Konfirmasi memakai AdminConfirmDialog, bukan window.confirm. Dialog bawaan
   * peramban tidak bisa diberi gaya, tampil berbeda di tiap peramban, dan
   * menutup diri saat Enter ditekan — padahal Enter itu justru yang ditekan
   * pengurus yang buru-buru, tanpa sempat membaca apa yang akan dipulihkan.
   */
  async function confirmRestore() {
    if (!revision || session.role !== 'superadmin') return

    setIsRestoreOpen(false)
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
    <AdminShell activeHref="/admin/history" title="Riwayat perubahan">
      <div className="adm-hist-toolbar">
        <label className="adm-field">
          <span className="sr-only">Cari riwayat</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari entitas, pelaku, atau field" />
        </label>
        <label className="adm-field">
          <span className="sr-only">Saring aksi</span>
          <select value={action} onChange={(event) => setAction(event.target.value as 'all' | AuditAction)}>
            <option value="all">Semua aksi</option>
            <option value="create">Dibuat</option>
            <option value="update">Diperbarui</option>
            <option value="delete">Dihapus</option>
            <option value="restore">Dipulihkan</option>
          </select>
        </label>
        <button className="adm-btn adm-btn--ghost" type="button" onClick={() => void loadHistory()}>
          Muat ulang
        </button>
      </div>

      {error ? <p className="adm-hist-error" role="alert">{error}</p> : null}
      {feedback ? <p className="adm-hist-feedback" role="status">{feedback}</p> : null}

      <section className="adm-panel">
        {isLoading ? (
          <>
            <div className="adm-row"><div className="adm-skeleton adm-hist-row-skeleton" aria-hidden="true" /></div>
            <div className="adm-row"><div className="adm-skeleton adm-hist-row-skeleton" aria-hidden="true" /></div>
            <div className="adm-row"><div className="adm-skeleton adm-hist-row-skeleton" aria-hidden="true" /></div>
          </>
        ) : visibleEntries.length === 0 ? (
          <div className="adm-empty">
            <h3>Belum ada perubahan yang cocok</h3>
            <p>Setiap kali sebuah konten dibuat, diubah, dihapus, atau dipulihkan lewat panel ini, jejaknya akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <button
              className="adm-row adm-hist-row"
              type="button"
              aria-current={entry.id === selected?.id ? 'true' : undefined}
              onClick={() => setSelectedId(entry.id)}
              key={entry.id}
            >
              <span className={`adm-chip ${actionChipVariant[entry.action]}`}>{actionLabels[entry.action]}</span>
              <span className="adm-row-main">
                <strong>{entityLabels[entry.entityType]} · {entry.entityId}</strong>
                <small>{formatTimestamp(entry.createdAt)} · {entry.actorEmail || entry.actorUid}</small>
              </span>
            </button>
          ))
        )}
      </section>

      {!isLoading && selected ? (
        <section className="adm-panel">
          <div className="adm-panel-head">
            <div>
              <h2>{entityLabels[selected.entityType]} · {selected.entityId}</h2>
              <p>{selected.actorEmail || selected.actorUid} · {selected.actorRole} · {formatTimestamp(selected.createdAt)}</p>
            </div>
            <span className={`adm-chip ${actionChipVariant[selected.action]}`}>{actionLabels[selected.action]}</span>
          </div>

          <div className="adm-hist-detail">
            <p><strong>Field berubah:</strong> {selected.changedFields.join(', ') || '—'}</p>

            {revision ? (
              <div className="adm-hist-diff">
                <div>
                  <span>Sebelum</span>
                  <pre>{formatSnapshot(revision.before)}</pre>
                </div>
                <div>
                  <span>Sesudah</span>
                  <pre>{formatSnapshot(revision.after)}</pre>
                </div>
              </div>
            ) : (
              <p>Snapshot revision tidak ditemukan.</p>
            )}

            {session.role === 'superadmin' && revision ? (
              <button
                className={`adm-btn${isRestoring ? ' is-loading' : ''}`}
                type="button"
                disabled={isRestoring}
                onClick={() => setIsRestoreOpen(true)}
              >
                Pulihkan snapshot ini
              </button>
            ) : (
              <p className="adm-hist-hint">Restore dikunci untuk superadmin. Riwayat tetap dapat dibaca semua admin aktif.</p>
            )}
          </div>
        </section>
      ) : null}

      {isRestoreOpen && revision ? (
        <AdminConfirmDialog
          body="Isi lama akan menggantikan yang sekarang, dan penggantian itu sendiri dicatat sebagai perubahan baru — jadi langkah ini masih bisa ditelusuri."
          confirmLabel="Pulihkan"
          isBusy={isRestoring}
          onCancel={() => setIsRestoreOpen(false)}
          onConfirm={() => void confirmRestore()}
          title={`Pulihkan ${entityLabels[revision.entityType]} "${revision.entityId}"?`}
        />
      ) : null}
    </AdminShell>
  )
}
