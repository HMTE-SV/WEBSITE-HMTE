'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'
import { validateGalleryImage } from '@/lib/admin/media-validation'
import {
  createContentDocument,
  deleteContentDocument,
  listContentDocuments,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { deleteImageFromStorage, uploadImageToStorage } from '@/lib/firebase/storage'
import type { GalleryDocument } from '@/types/firestore'

export function AdminGalleryManager() {
  const [items, setItems] = useState<GalleryDocument[]>([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
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

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')

    if (!file) {
      setError('Pilih gambar terlebih dahulu.')
      return
    }

    const validation = validateGalleryImage(file)

    if (!validation.success) {
      setError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)

    try {
      const uploaded = await uploadImageToStorage({
        file,
        folder: 'gallery',
      })

      await createContentDocument<GalleryDocument>('gallery', {
        alt: title.trim() || file.name,
        caption: caption.trim(),
        imageUrl: uploaded.downloadUrl,
        order: Date.now(),
        status: 'published',
        storagePath: uploaded.path,
        title: title.trim() || file.name,
      })

      setTitle('')
      setCaption('')
      setFile(null)
      setFeedback('Gambar galeri berhasil diunggah.')
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

      if (item.storagePath) {
        await deleteImageFromStorage(item.storagePath)
      }

      setFeedback('Gambar berhasil dihapus.')
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
      description="Upload dan kelola foto kegiatan HMTE."
      kicker="Galeri"
      title="Kelola galeri"
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat upload gambar ke Firebase Storage."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : (
        <>
          <form className="admin-content-form" onSubmit={handleUpload}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="gallery-title">Judul gambar</label>
                <input id="gallery-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="gallery-file">File gambar</label>
                <input
                  id="gallery-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </div>
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
                {isUploading ? 'Mengunggah...' : 'Upload gambar'}
              </button>
            </div>
          </form>

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
                    <button type="button" onClick={() => void handleDelete(item)} disabled={busyId === item.id}>
                      Hapus
                    </button>
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
