'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminImageField } from './AdminImageField'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import { validateGalleryImageUrl } from '@/lib/admin/media-validation'
import {
  createContentDocument,
  deleteContentDocument,
  listContentDocuments,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { GalleryDocument } from '@/types/firestore'

export function AdminGalleryManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [items, setItems] = useState<GalleryDocument[]>([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isUploading, setIsUploading] = useState(false)
  const [busyId, setBusyId] = useState('')

  const loadGallery = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const documents = await listContentDocuments<GalleryDocument>('gallery')
      setItems(documents)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat galeri.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGallery()
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [loadGallery])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')

    const validation = validateGalleryImageUrl(imageUrl.trim())

    if (!validation.success) {
      setError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)

    try {
      await createContentDocument<GalleryDocument>('gallery', {
        alt: title.trim(),
        caption: caption.trim(),
        imageUrl: imageUrl.trim(),
        order: Date.now(),
        status: 'published',
        title: title.trim(),
      })

      setTitle('')
      setCaption('')
      setImageUrl('')
      setFeedback('Gambar galeri berhasil ditambahkan.')
      await loadGallery()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(item: GalleryDocument) {
    const confirmed = window.confirm(`Hapus gambar "${item.title}"?`)

    if (!confirmed) {
      return
    }

    setBusyId(item.id)
    setError('')
    setFeedback('')

    try {
      await deleteContentDocument('gallery', item.id)
      setFeedback('Data gambar berhasil dihapus dari Firestore. File asli di ImageKit tidak ikut dihapus.')
      await loadGallery()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus gambar.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell
      activeHref="/admin/gallery"
      description="Kelola referensi foto kegiatan HMTE dari ImageKit."
      kicker="Galeri"
      title="Kelola galeri"
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola referensi gambar di Firestore."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : (
        <>
          {canWrite ? (
            <form className="admin-content-form" onSubmit={handleCreate}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="gallery-title">Judul gambar</label>
                <input
                  id="gallery-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <AdminImageField
                folder="galeri"
                hint="Maksimal 5MB, format JPG, PNG, atau WebP."
                label="Gambar"
                onChange={setImageUrl}
                value={imageUrl}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="gallery-caption">Caption</label>
              <textarea
                id="gallery-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={3}
              />
            </div>
            {error ? (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            ) : null}
            {feedback ? <p className="admin-form-success">{feedback}</p> : null}
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="submit" disabled={isUploading}>
                {isUploading ? 'Menyimpan...' : 'Tambah gambar'}
              </button>
            </div>
            </form>
          ) : (
            <AdminEmptyState
              body="Role viewer dapat melihat galeri, tetapi tidak dapat menambah atau menghapus referensi gambar."
              kicker="Akses"
              title="Mode lihat saja"
            />
          )}

          {isLoading ? (
            <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data galeri..." />
          ) : items.length === 0 ? (
            <AdminEmptyState
              body="Upload gambar pertama untuk mulai mengisi galeri publik."
              title="Belum ada gambar galeri."
            />
          ) : (
            <div className="admin-gallery-grid">
              {items.map((item) => (
                <article className="admin-gallery-item" key={item.id}>
                  <Image src={item.imageUrl} alt={item.alt} width={640} height={360} />
                  <div>
                    <strong>{item.title}</strong>
                    {item.caption ? <p>{item.caption}</p> : null}
                    {canWrite ? (
                      <button type="button" onClick={() => void handleDelete(item)} disabled={busyId === item.id}>
                        Hapus
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}
