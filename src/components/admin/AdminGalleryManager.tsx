'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminDrawer } from './AdminDrawer'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminImageField } from './AdminImageField'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import { validateGalleryInput } from '@/lib/admin/content-form-validation'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { requestRevalidation } from '@/lib/admin/revalidate'
import {
  createContentDocument,
  deleteContentDocument,
  listContentDocuments,
  swapGalleryOrder,
  updateContentDocument,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { ContentStatus } from '@/types/content'
import type { GalleryDocument } from '@/types/firestore'

/*
 * Galeri memakai KISI, bukan baris — pengecualian yang disahkan §4 karena
 * isinya memang visual. Menyunting tetap pindah ke laci kanan supaya kisinya
 * tidak didorong keluar layar oleh formulir sebaris seperti sebelumnya.
 */

type GalleryFormValues = Pick<GalleryDocument, 'alt' | 'imageUrl' | 'status' | 'title'> & { caption: string }

const emptyValues: GalleryFormValues = {
  alt: '',
  caption: '',
  imageUrl: '',
  status: 'draft',
  title: '',
}

const statusLabels: Record<ContentStatus, string> = {
  draft: 'Draft',
  published: 'Terbit',
  archived: 'Arsip',
}

const statusChipVariant: Record<ContentStatus, string> = {
  draft: 'adm-chip--warn',
  published: 'adm-chip--ok',
  archived: '',
}

function formValuesFromItem(item: GalleryDocument): GalleryFormValues {
  return {
    alt: item.alt,
    caption: item.caption ?? '',
    imageUrl: item.imageUrl,
    status: item.status,
    title: item.title,
  }
}

export function AdminGalleryManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [items, setItems] = useState<GalleryDocument[]>([])
  const [values, setValues] = useState<GalleryFormValues>(emptyValues)
  const [loadedSnapshot, setLoadedSnapshot] = useState(JSON.stringify(emptyValues))
  const [editingId, setEditingId] = useState('')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<GalleryDocument | null>(null)
  const isDirty = JSON.stringify(values) !== loadedSnapshot

  useUnsavedChangesGuard(canWrite && isDrawerOpen && isDirty)

  const loadGallery = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setErrors([])
    try {
      const documents = await listContentDocuments<GalleryDocument>('gallery')
      setItems([...documents].sort((first, second) => first.order - second.order))
    } catch (loadError) {
      setErrors([loadError instanceof Error ? loadError.message : 'Gagal memuat galeri.'])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadGallery(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadGallery])

  const publishedCount = useMemo(() => items.filter((item) => item.status === 'published').length, [items])

  function updateField<Key extends keyof GalleryFormValues>(key: Key, value: GalleryFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors([])
    setFeedback('')
  }

  function openCreateDrawer() {
    setValues(emptyValues)
    setLoadedSnapshot(JSON.stringify(emptyValues))
    setEditingId('')
    setErrors([])
    setFeedback('')
    setIsDrawerOpen(true)
  }

  function openEditDrawer(item: GalleryDocument) {
    const nextValues = formValuesFromItem(item)
    setValues(nextValues)
    setLoadedSnapshot(JSON.stringify(nextValues))
    setEditingId(item.id)
    setErrors([])
    setFeedback('')
    setIsDrawerOpen(true)
  }

  // AdminDrawer sendiri sudah menahan tutup dan minta konfirmasi selama dirty.
  function closeDrawer() {
    setIsDrawerOpen(false)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateGalleryInput(values)
    setErrors(validation.errors)
    setFeedback('')
    if (!validation.success) return

    setIsSaving(true)
    try {
      const payload = {
        alt: values.alt.trim(),
        caption: values.caption.trim(),
        imageUrl: values.imageUrl.trim(),
        status: values.status,
        title: values.title.trim(),
      }
      if (editingId) {
        await updateContentDocument<GalleryDocument>('gallery', editingId, payload)
        setFeedback('Item galeri diperbarui.')
      } else {
        const nextOrder = items.reduce((highest, item) => Math.max(highest, item.order), 0) + 1
        await createContentDocument<GalleryDocument>('gallery', { ...payload, order: nextOrder })
        setFeedback(values.status === 'published' ? 'Gambar ditambahkan dan diterbitkan.' : 'Draft galeri berhasil dibuat.')
      }
      setLoadedSnapshot(JSON.stringify(values))
      setIsDrawerOpen(false)
      await loadGallery()
      await requestRevalidation('gallery')
    } catch (saveError) {
      setErrors([saveError instanceof Error ? saveError.message : 'Gagal menyimpan item galeri.'])
    } finally {
      setIsSaving(false)
    }
  }

  async function moveItem(item: GalleryDocument, direction: -1 | 1) {
    const index = items.findIndex((candidate) => candidate.id === item.id)
    const target = items[index + direction]
    if (index < 0 || !target) return
    setBusyId(`order:${item.id}`)
    setErrors([])
    setFeedback('')
    try {
      await swapGalleryOrder(item, target)
      await loadGallery()
      await requestRevalidation('gallery')
      setFeedback('Urutan galeri diperbarui.')
    } catch (moveError) {
      setErrors([moveError instanceof Error ? moveError.message : 'Urutan galeri gagal diubah.'])
    } finally {
      setBusyId('')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const item = deleteTarget
    setBusyId(item.id)
    setErrors([])
    setFeedback('')
    try {
      await deleteContentDocument('gallery', item.id)
      if (editingId === item.id) closeDrawer()
      setDeleteTarget(null)
      await loadGallery()
      await requestRevalidation('gallery')
      setFeedback('Data gambar dihapus dari Firestore. File asli tetap tersimpan di ImageKit.')
    } catch (deleteError) {
      setErrors([deleteError instanceof Error ? deleteError.message : 'Gagal menghapus gambar.'])
    } finally {
      setBusyId('')
    }
  }

  const primaryAction = canWrite ? (
    <button className="adm-btn" type="button" onClick={openCreateDrawer}>+ Tambah item</button>
  ) : null

  return (
    <AdminShell activeHref="/admin/gallery" title="Galeri" actions={primaryAction}>
      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola galeri." title="Firebase belum siap." />
      ) : (
        <>
          <p className="adp-summary">
            <strong>{items.length}</strong> total item · <strong>{publishedCount}</strong> tampil publik. Urutan panel sama dengan urutan halaman publik.
          </p>

          {!canWrite ? (
            <p className="adp-inline-error" role="status">Role viewer dapat melihat galeri, tetapi tidak dapat mengubahnya.</p>
          ) : null}

          {errors.length ? <div className="adp-inline-error" role="alert">{errors.map((message) => <p key={message}>{message}</p>)}</div> : null}
          {feedback ? <p className="adp-inline-success" role="status">{feedback}</p> : null}

          {isLoading ? (
            <div className="adp-grid" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => <div className="adm-skeleton adp-tile-skeleton" key={index} />)}
            </div>
          ) : items.length === 0 ? (
            <AdminEmptyState
              title="Belum ada gambar galeri."
              body="Foto kegiatan HMTE akan tampil di sini begitu ditambahkan. Buat draft pertama untuk mulai mengisi galeri publik."
              action={primaryAction}
            />
          ) : (
            <div className="adp-grid">
              {items.map((item, index) => (
                <article className="adp-tile" data-status={item.status} key={item.id}>
                  <div className="adp-tile-media">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.alt || ''} width={480} height={300} />
                    ) : (
                      <span>Draft tanpa gambar</span>
                    )}
                    <b className="adp-tile-index">{String(index + 1).padStart(2, '0')}</b>
                  </div>
                  <div className="adp-tile-body">
                    <span className={`adm-chip ${statusChipVariant[item.status]}`.trim()}>{statusLabels[item.status]}</span>
                    <strong>{item.title || 'Tanpa judul'}</strong>
                    {item.caption ? <p>{item.caption}</p> : null}
                    <div className="adp-tile-actions">
                      <button type="button" aria-label="Naikkan urutan" disabled={!canWrite || busyId === `order:${item.id}` || index === 0} onClick={() => void moveItem(item, -1)}>↑</button>
                      <button type="button" aria-label="Turunkan urutan" disabled={!canWrite || busyId === `order:${item.id}` || index === items.length - 1} onClick={() => void moveItem(item, 1)}>↓</button>
                      {canWrite ? <button className="adm-btn adm-btn--ghost" type="button" onClick={() => openEditDrawer(item)}>Edit</button> : null}
                      {canWrite ? <button className="adm-btn adm-btn--danger" type="button" onClick={() => setDeleteTarget(item)} disabled={busyId === item.id}>Hapus</button> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {isDrawerOpen ? (
        <AdminDrawer
          title={editingId ? 'Edit item galeri' : 'Item galeri baru'}
          isDirty={isDirty}
          onClose={closeDrawer}
          footer={
            <>
              <span>{isDirty ? 'Belum disimpan' : 'Tersimpan'}</span>
              <button className="adm-btn" form="gallery-editor-form" type="submit" disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Simpan item'}
              </button>
            </>
          }
        >
          <form className="adp-drawer-form" id="gallery-editor-form" onSubmit={handleSave}>
            <div className="adm-field">
              <label htmlFor="gallery-title">Judul gambar</label>
              <input id="gallery-title" value={values.title} maxLength={180} onChange={(event) => updateField('title', event.target.value)} />
              <small>{values.title.length}/180</small>
            </div>
            <div className="adm-field">
              <label htmlFor="gallery-status">Status</label>
              <select id="gallery-status" value={values.status} onChange={(event) => updateField('status', event.target.value as ContentStatus)}>
                <option value="draft">Draft</option>
                <option value="published">Terbit</option>
                <option value="archived">Arsip</option>
              </select>
            </div>
            <AdminImageField folder="galeri" hint="Pemilih otomatis membuka kategori Galeri. Maksimal 5MB, JPG, PNG, atau WebP." label="Gambar" onChange={(value) => updateField('imageUrl', value)} value={values.imageUrl} />
            <div className="adm-field">
              <label htmlFor="gallery-alt">Deskripsi gambar</label>
              <input id="gallery-alt" value={values.alt} maxLength={240} onChange={(event) => updateField('alt', event.target.value)} placeholder="Jelaskan apa yang terlihat untuk pembaca layar" />
              <small>{values.alt.length}/240 · wajib sebelum terbit</small>
            </div>
            <div className="adm-field">
              <label htmlFor="gallery-caption">Caption</label>
              <textarea id="gallery-caption" value={values.caption} maxLength={500} onChange={(event) => updateField('caption', event.target.value)} rows={3} />
              <small>{values.caption.length}/500</small>
            </div>
            {errors.length ? <div className="adp-inline-error" role="alert">{errors.map((message) => <p key={message}>{message}</p>)}</div> : null}
          </form>
        </AdminDrawer>
      ) : null}

      {deleteTarget ? (
        <AdminConfirmDialog
          title="Hapus gambar galeri?"
          body={`"${deleteTarget.title || 'Gambar ini'}" akan dihapus dari Firestore. File ImageKit tidak ikut terhapus.`}
          isBusy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </AdminShell>
  )
}
