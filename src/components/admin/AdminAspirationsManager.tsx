'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminDrawer } from './AdminDrawer'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments, updateContentDocument } from '@/lib/firebase/content-services'
import type { AspirationDocument, AspirationStatus } from '@/types/firestore'

/*
 * Kotak masuk, bukan CRUD.
 *
 * Aspirasi datang dari mahasiswa lewat formulir publik; panel ini hanya baca
 * dan mengubah status/catatan internal. Tidak ada tombol "Tambah" — spesifikasi
 * §7 menegaskan halaman ini tidak punya pembuatan.
 */

const aspirationStatuses: AspirationStatus[] = [
  'submitted',
  'reviewed',
  'discussed',
  'in_progress',
  'resolved',
  'archived',
]

const statusLabels: Record<AspirationStatus, string> = {
  submitted: 'Baru masuk',
  reviewed: 'Ditinjau',
  discussed: 'Dibahas',
  in_progress: 'Diproses',
  resolved: 'Selesai',
  archived: 'Diarsipkan',
}

type Toast = { id: number; kind: 'ok' | 'danger'; message: string }

export function AdminAspirationsManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [items, setItems] = useState<AspirationDocument[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AspirationStatus | 'all'>('all')
  const [openId, setOpenId] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  // State, bukan ref: `isNotesDirty` membacanya saat render, dan ref tidak
  // boleh dibaca di situ.
  const [initialNotes, setInitialNotes] = useState('')

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

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function notify(kind: Toast['kind'], message: string) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, message }))
  }

  async function updateAspiration(id: string, data: Partial<AspirationDocument>, successMessage: string) {
    setBusyId(id)

    try {
      await updateContentDocument<AspirationDocument>('aspirations', id, data)
      setItems((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)))
      notify('ok', successMessage)
    } catch (updateError) {
      notify('danger', updateError instanceof Error ? updateError.message : 'Gagal memperbarui aspirasi.')
    } finally {
      setBusyId('')
    }
  }

  const openItem = items.find((item) => item.id === openId) || null

  function openDetail(item: AspirationDocument) {
    setOpenId(item.id)
    setDraftNotes(item.internalNotes || '')
    setInitialNotes(item.internalNotes || '')
  }

  function closeDetail() {
    // Catatan yang belum di-blur (belum tersimpan) dikirim dulu supaya menutup
    // laci lewat Esc atau klik latar tidak diam-diam membuang tulisan orang.
    if (openItem && draftNotes !== initialNotes) {
      void updateAspiration(openItem.id, { internalNotes: draftNotes }, 'Catatan internal disimpan.')
    }
    setOpenId('')
    setDraftNotes('')
  }

  const isNotesDirty = draftNotes !== initialNotes

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('id-ID')

    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!needle) return true
      const sender = item.isAnonymous ? 'anonim' : (item.senderName || '').toLocaleLowerCase('id-ID')
      const message = item.message.toLocaleLowerCase('id-ID')
      return sender.includes(needle) || message.includes(needle)
    })
  }, [items, search, statusFilter])

  return (
    <AdminShell activeHref="/admin/aspirations" title="Aspirasi">
      {!hasFirebaseConfig() ? (
        <div className="adm-empty">
          <h3>Firebase belum siap.</h3>
          <p>Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat membaca aspirasi dari Firestore.</p>
        </div>
      ) : (
        <div className="adm-panel">
          <div className="adm-panel-head">
            <h2>Kotak masuk aspirasi</h2>
            <p>{isLoading ? 'Memuat…' : `${filteredItems.length} dari ${items.length} aspirasi`}</p>
          </div>

          <div className="adm-org-toolbar">
            <div className="adm-org-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari pengirim atau isi pesan…"
                aria-label="Cari aspirasi"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AspirationStatus | 'all')}
              aria-label="Saring status"
            >
              <option value="all">Semua status</option>
              {aspirationStatuses.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="adm-org-alert adm-org-alert--danger" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div className="adm-org-skeleton-row" key={index}>
                  <span className="adm-skeleton" style={{ width: '50%', height: 14 }} />
                  <span className="adm-skeleton" style={{ width: '15%', height: 14 }} />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="adm-empty">
              <h3>{items.length === 0 ? 'Belum ada aspirasi.' : 'Tidak ada yang cocok.'}</h3>
              <p>
                {items.length === 0
                  ? 'Aspirasi yang dikirim mahasiswa lewat formulir publik akan muncul di sini.'
                  : 'Ubah kata kunci pencarian atau saringan status di atas.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <button className="adm-row adm-org-row-button" type="button" key={item.id} onClick={() => openDetail(item)}>
                <div className="adm-row-main">
                  <strong>{item.isAnonymous ? 'Anonim' : item.senderName || 'Tanpa nama'}</strong>
                  <small>{item.message}</small>
                </div>
                <span className="adm-chip">{item.category}</span>
                <span className={`adm-chip${item.status === 'resolved' ? ' adm-chip--ok' : item.status === 'submitted' ? ' adm-chip--warn' : ''}`}>
                  {statusLabels[item.status]}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {openItem ? (
        <AdminDrawer
          title={openItem.isAnonymous ? 'Aspirasi anonim' : openItem.senderName || 'Aspirasi'}
          isDirty={canWrite && isNotesDirty}
          onClose={closeDetail}
          footer={
            <button className="adm-btn adm-btn--ghost" type="button" onClick={closeDetail}>
              Tutup
            </button>
          }
        >
          <div className="adm-org-grid-2">
            <div className="adm-field">
              <label>Kategori</label>
              <p className="adm-org-readonly">{openItem.category}</p>
            </div>
            <div className="adm-field">
              <label>Pengirim</label>
              <p className="adm-org-readonly">
                {openItem.isAnonymous ? 'Anonim' : openItem.senderName || 'Tanpa nama'}
                {openItem.senderEmail && !openItem.isAnonymous ? ` · ${openItem.senderEmail}` : ''}
              </p>
            </div>
          </div>

          <div className="adm-field">
            <label>Pesan</label>
            <p className="adm-org-readonly adm-org-readonly--message">{openItem.message}</p>
          </div>

          <div className="adm-field">
            <label htmlFor="asp-status">Status</label>
            <select
              id="asp-status"
              value={openItem.status}
              disabled={!canWrite || busyId === openItem.id}
              onChange={(event) =>
                void updateAspiration(
                  openItem.id,
                  { status: event.target.value as AspirationStatus },
                  'Status aspirasi diperbarui.',
                )
              }
            >
              {aspirationStatuses.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="adm-field">
            <label htmlFor="asp-notes">Catatan internal</label>
            <textarea
              id="asp-notes"
              value={draftNotes}
              disabled={!canWrite}
              rows={4}
              onChange={(event) => setDraftNotes(event.target.value)}
              onBlur={() => {
                if (draftNotes !== initialNotes) {
                  setInitialNotes(draftNotes)
                  void updateAspiration(openItem.id, { internalNotes: draftNotes }, 'Catatan internal disimpan.')
                }
              }}
            />
            <small>Tidak tampil ke publik. Tersimpan otomatis saat kolom ini kehilangan fokus.</small>
          </div>
        </AdminDrawer>
      ) : null}

      {toast ? (
        <div className="adm-toasts">
          <div className={`adm-toast${toast.kind === 'danger' ? ' adm-toast--danger' : ''}`} role="status">
            {toast.message}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
