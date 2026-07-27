'use client'

import { useId, useRef, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { uploadImageToImageKit, type ImageKitFolder } from '@/lib/admin/imagekit-upload'
import { validateArticleCoverImage, validateGalleryImage } from '@/lib/admin/media-validation'

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
} as const satisfies Record<ImageKitFolder, (file: File) => { errors: string[]; success: boolean }>

export function AdminImageField({ folder, hint, label, onChange, value }: AdminImageFieldProps) {
  const fieldId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

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
      const url = await uploadImageToImageKit(file, folder, async () => {
        const currentUser = getFirebaseAuth().currentUser

        if (!currentUser) {
          throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        }

        return currentUser.getIdToken()
      })

      onChange(url)
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
      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  )
}
