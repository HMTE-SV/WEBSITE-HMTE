'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  published: 'Published',
  archived: 'Archived',
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
  const [errors, setErrors] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSaving, setIsSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const isDirty = JSON.stringify(values) !== loadedSnapshot

  useUnsavedChangesGuard(canWrite && isDirty)

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

  function resetEditor(force = false) {
    if (!force && isDirty && !window.confirm('Buang perubahan galeri yang belum disimpan?')) return
    setValues(emptyValues)
    setLoadedSnapshot(JSON.stringify(emptyValues))
    setEditingId('')
    setErrors([])
    setFeedback('')
  }

  function editItem(item: GalleryDocument) {
    if (isDirty && !window.confirm('Buang perubahan galeri yang belum disimpan dan buka item lain?')) return
    const nextValues = formValuesFromItem(item)
    setValues(nextValues)
    setLoadedSnapshot(JSON.stringify(nextValues))
    setEditingId(item.id)
    setErrors([])
    setFeedback('')
    document.getElementById('gallery-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      setValues(emptyValues)
      setLoadedSnapshot(JSON.stringify(emptyValues))
      setEditingId('')
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

  async function handleDelete(item: GalleryDocument) {
    if (!window.confirm(`Hapus gambar "${item.title}"? File ImageKit tidak ikut dihapus.`)) return
    setBusyId(item.id)
    setErrors([])
    setFeedback('')
    try {
      await deleteContentDocument('gallery', item.id)
      if (editingId === item.id) resetEditor(true)
      await loadGallery()
      await requestRevalidation('gallery')
      setFeedback('Data gambar dihapus dari Firestore. File asli tetap tersimpan di ImageKit.')
    } catch (deleteError) {
      setErrors([deleteError instanceof Error ? deleteError.message : 'Gagal menghapus gambar.'])
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell activeHref="/admin/gallery" description="Edit metadata, status publikasi, dan urutan foto kegiatan HMTE." kicker="Galeri" title="Kelola galeri">
      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola galeri." kicker="Konfigurasi" title="Firebase belum siap." />
      ) : (
        <div className="admin-gallery-workspace">
          <section className="admin-gallery-summary">
            <div><span>Arsip visual</span><strong>{items.length}</strong><small>total item</small></div>
            <div><span>Terbit</span><strong>{publishedCount}</strong><small>tampil publik</small></div>
            <p>Urutan panel sama dengan urutan halaman publik. Draft dan arsip tetap tersimpan tetapi tidak terlihat pengunjung.</p>
          </section>

          {canWrite ? (
            <form className="admin-content-form admin-gallery-editor" id="gallery-editor" onSubmit={handleSave}>
              <header><div><span>{editingId ? 'Edit item' : 'Item baru'}</span><h2>{editingId ? 'Perbarui foto galeri.' : 'Tambahkan dokumentasi.'}</h2></div>{editingId ? <button className="admin-secondary-button" type="button" onClick={() => resetEditor()}>Batal edit</button> : null}</header>
              <div className="admin-form-grid">
                <div className="admin-field"><label htmlFor="gallery-title">Judul gambar</label><input id="gallery-title" value={values.title} maxLength={180} onChange={(event) => updateField('title', event.target.value)} /><small>{values.title.length}/180</small></div>
                <div className="admin-field"><label htmlFor="gallery-status">Status</label><select id="gallery-status" value={values.status} onChange={(event) => updateField('status', event.target.value as ContentStatus)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><small>{values.status === 'published' ? 'Tampil di galeri publik' : values.status === 'draft' ? 'Hanya terlihat admin' : 'Disimpan sebagai arsip'}</small></div>
              </div>
              <AdminImageField folder="galeri" hint="Pemilih otomatis membuka kategori Galeri. Maksimal 5MB, JPG, PNG, atau WebP." label="Gambar" onChange={(value) => updateField('imageUrl', value)} value={values.imageUrl} />
              <div className="admin-field"><label htmlFor="gallery-alt">Deskripsi gambar</label><input id="gallery-alt" value={values.alt} maxLength={240} onChange={(event) => updateField('alt', event.target.value)} placeholder="Jelaskan apa yang terlihat untuk pembaca layar" /><small>{values.alt.length}/240 · wajib sebelum published</small></div>
              <div className="admin-field"><label htmlFor="gallery-caption">Caption</label><textarea id="gallery-caption" value={values.caption} maxLength={500} onChange={(event) => updateField('caption', event.target.value)} rows={3} /><small>{values.caption.length}/500</small></div>
              {errors.length ? <div className="admin-form-error" role="alert">{errors.map((message) => <p key={message}>{message}</p>)}</div> : null}
              {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}
              <div className="admin-form-actions"><span>{isDirty ? 'Perubahan belum disimpan' : 'Editor bersih'}</span><button className="admin-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Simpan item'}</button></div>
            </form>
          ) : <AdminEmptyState body="Role viewer dapat melihat galeri, tetapi tidak dapat mengubahnya." kicker="Akses" title="Mode lihat saja" />}

          {isLoading ? (
            <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data galeri..." />
          ) : items.length === 0 ? (
            <AdminEmptyState body="Buat draft pertama untuk mulai mengisi galeri publik." title="Belum ada gambar galeri." />
          ) : (
            <div className="admin-gallery-grid">
              {items.map((item, index) => (
                <article className="admin-gallery-item" data-status={item.status} key={item.id}>
                  <div className="admin-gallery-image">{item.imageUrl ? <Image src={item.imageUrl} alt={item.alt || ''} width={640} height={360} /> : <span>Draft tanpa gambar</span>}<b>{String(index + 1).padStart(2, '0')}</b></div>
                  <div className="admin-gallery-item-copy">
                    <span className="admin-gallery-status">{statusLabels[item.status]}</span>
                    <strong>{item.title || 'Tanpa judul'}</strong>
                    {item.caption ? <p>{item.caption}</p> : null}
                    <div className="admin-gallery-item-actions">
                      <button type="button" disabled={!canWrite || busyId === `order:${item.id}` || index === 0} onClick={() => void moveItem(item, -1)}>↑ Naik</button>
                      <button type="button" disabled={!canWrite || busyId === `order:${item.id}` || index === items.length - 1} onClick={() => void moveItem(item, 1)}>↓ Turun</button>
                      {canWrite ? <button type="button" onClick={() => editItem(item)}>Edit</button> : null}
                      {canWrite ? <button className="is-danger" type="button" onClick={() => void handleDelete(item)} disabled={busyId === item.id}>Hapus</button> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  )
}
