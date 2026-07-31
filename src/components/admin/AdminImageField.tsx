'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { listContentDocuments } from '@/lib/firebase/content-services'
import { uploadImageToImageKit, type ImageKitFolder } from '@/lib/admin/imagekit-upload'
import {
  DEFAULT_MEDIA_PICKER_LIMIT,
  filterPickerMedia,
  mediaFolderLabels,
  registerUploadedMedia,
  type MediaFolderFilter,
} from '@/lib/admin/media-library'
import { validateArticleCoverImage, validateGalleryImage } from '@/lib/admin/media-validation'
import type { MediaDocument } from '@/types/firestore'

/*
 * Satu isian gambar untuk foto pengurus, cover berita, dan galeri.
 *
 * Sebelumnya ketiganya meminta URL ImageKit yang ditempel manual, artinya
 * pengurus harus membuka dasbor ImageKit di tab lain, mengunggah, menyalin URL,
 * lalu kembali. Itu bekerja, tapi hanya untuk orang yang sudah tahu caranya, dan
 * panel ini akan dipegang sembilan perwakilan bidang yang berganti tiap tahun.
 *
 * Isian URL tetap ada dan tetap bisa diketik. Unggahan adalah jalan yang mudah,
 * bukan satu-satunya jalan: gambar yang sudah ada di ImageKit tidak perlu
 * diunggah ulang hanya karena tombolnya sekarang ada.
 */

type AdminImageFieldProps = {
  folder: ImageKitFolder
  hint?: string
  label: string
  onChange: (url: string) => void
  value: string
}

const maxSizeValidators = {
  pengurus: validateArticleCoverImage,
  berita: validateArticleCoverImage,
  galeri: validateGalleryImage,
  situs: validateGalleryImage,
} as const satisfies Record<ImageKitFolder, (file: File) => { errors: string[]; success: boolean }>

export function AdminImageField({ folder, hint, label, onChange, value }: AdminImageFieldProps) {
  const fieldId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [libraryItems, setLibraryItems] = useState<MediaDocument[]>([])
  const [libraryFolder, setLibraryFolder] = useState<MediaFolderFilter>(folder)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryLimit, setLibraryLimit] = useState(DEFAULT_MEDIA_PICKER_LIMIT)
  const pickerResult = useMemo(
    () => filterPickerMedia(libraryItems, { folder: libraryFolder, query: libraryQuery, limit: libraryLimit }),
    [libraryFolder, libraryItems, libraryLimit, libraryQuery],
  )

  async function openLibrary() {
    setIsLibraryOpen(true)
    if (libraryItems.length > 0) return

    setIsLibraryLoading(true)
    setUploadError('')
    try {
      const items = await listContentDocuments<MediaDocument>('media')
      setLibraryItems(
        items
          .filter((item) => item.status === 'active')
          .sort((first, second) => (second.createdAt?.toMillis?.() ?? 0) - (first.createdAt?.toMillis?.() ?? 0)),
      )
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Gagal membuka pustaka media.')
    } finally {
      setIsLibraryLoading(false)
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) {
      return
    }

    setUploadError('')
    const validation = maxSizeValidators[folder](file)

    if (!validation.success) {
      setUploadError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)

    try {
      const upload = await uploadImageToImageKit(file, folder, async () => {
        const currentUser = getFirebaseAuth().currentUser

        if (!currentUser) {
          throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        }

        return currentUser.getIdToken()
      })

      await registerUploadedMedia(upload, file, folder)
      onChange(upload.url)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)

      // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu
      // onChange. Tanpa ini, percobaan ulang setelah gagal terasa macet.
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="admin-field admin-image-field">
      <label htmlFor={fieldId}>{label}</label>

      <div className="admin-image-field-row">
        {value ? (
          // Sengaja <img>, bukan next/image. Nilainya bisa berupa URL apa pun
          // yang baru saja diketik pengurus, dan next/image menolak host yang
          // tidak terdaftar dengan melempar error yang merusak seluruh form.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="admin-image-field-preview" src={value} alt="" />
        ) : (
          <div className="admin-image-field-preview is-empty" aria-hidden="true">
            <span>Belum ada</span>
          </div>
        )}

        <div className="admin-image-field-controls">
          <input
            id={fieldId}
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://ik.imagekit.io/..."
          />
          <div className="admin-image-field-actions">
            <button
              className="admin-secondary-button"
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Mengunggah...' : 'Unggah gambar'}
            </button>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={isUploading}
              onClick={() => void openLibrary()}
            >
              Pilih dari pustaka
            </button>
            {value ? (
              <button className="admin-secondary-button" type="button" onClick={() => onChange('')}>
                Hapus
              </button>
            ) : null}
          </div>
          <input
            className="admin-visually-hidden"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            tabIndex={-1}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      </div>

      {uploadError ? (
        <p className="admin-form-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      {isLibraryOpen ? (
        <div className="admin-image-library-picker">
          <div>
            <strong>Pustaka media</strong>
            <button type="button" onClick={() => setIsLibraryOpen(false)} aria-label="Tutup pustaka">
              ×
            </button>
          </div>
          <div className="admin-image-library-filters">
            <label>
              <span>Cari gambar</span>
              <input
                type="search"
                value={libraryQuery}
                onChange={(event) => { setLibraryQuery(event.target.value); setLibraryLimit(DEFAULT_MEDIA_PICKER_LIMIT) }}
                placeholder="Nama file, alt, atau kredit"
              />
            </label>
            <label>
              <span>Kategori</span>
              <select value={libraryFolder} onChange={(event) => { setLibraryFolder(event.target.value as MediaFolderFilter); setLibraryLimit(DEFAULT_MEDIA_PICKER_LIMIT) }}>
                <option value="all">Semua kategori</option>
                {Object.entries(mediaFolderLabels).map(([value, label]) => (
                  <option value={value} key={value}>{label}{value === folder ? ' · disarankan' : ''}</option>
                ))}
              </select>
            </label>
          </div>
          {isLibraryLoading ? (
            <p>Memuat media...</p>
          ) : pickerResult.total === 0 ? (
            <p>{libraryItems.length === 0 ? 'Belum ada media aktif. Unggah gambar untuk mendaftarkannya.' : 'Tidak ada gambar yang cocok dengan filter ini.'}</p>
          ) : (
            <>
              <p className="admin-image-library-count">Menampilkan {pickerResult.items.length} dari {pickerResult.total} gambar</p>
              <div className="admin-image-library-grid">
                {pickerResult.items.map((item) => (
                  <button
                    type="button"
                    className={item.url === value ? 'is-selected' : undefined}
                    key={item.id}
                    onClick={() => {
                      onChange(item.url)
                      setIsLibraryOpen(false)
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnailUrl || item.url} alt="" />
                    <span>{item.alt || item.originalFileName}</span>
                  </button>
                ))}
              </div>
              {pickerResult.items.length < pickerResult.total ? (
                <button
                  className="admin-image-library-more"
                  type="button"
                  onClick={() => setLibraryLimit((current) => current + DEFAULT_MEDIA_PICKER_LIMIT)}
                >
                  Tampilkan {Math.min(DEFAULT_MEDIA_PICKER_LIMIT, pickerResult.total - pickerResult.items.length)} lagi
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  )
}
