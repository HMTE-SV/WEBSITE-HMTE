'use client'

import { useRef, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { uploadImageToImageKit } from '@/lib/admin/imagekit-upload'
import {
  makeEmptyPublicDataResource,
  publicDataResourceKindLabels,
  validatePublicDataFile,
  type PublicDataResource,
  type PublicDataResourceKind,
} from '@/lib/public-data'

type AdminDataResourcesEditorProps = {
  onChange: (resources: PublicDataResource[]) => void
  value: PublicDataResource[]
}

function formatBytes(value?: number) {
  if (!value) return ''
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

function fileExtension(name: string) {
  return name.split('.').pop()?.toUpperCase() || 'BERKAS'
}

export function AdminDataResourcesEditor({ onChange, value }: AdminDataResourcesEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  function addResource(kind: PublicDataResourceKind) {
    onChange([...value, { ...makeEmptyPublicDataResource(), kind }])
  }

  function updateResource(id: string, patch: Partial<PublicDataResource>) {
    onChange(value.map((resource) => resource.id === id ? { ...resource, ...patch } : resource))
  }

  async function handleFile(file?: File) {
    if (!file) return
    setError('')
    const validation = validatePublicDataFile(file)
    if (!validation.success) {
      setError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)
    try {
      const upload = await uploadImageToImageKit(file, 'data', async () => {
        const user = getFirebaseAuth().currentUser
        if (!user) throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        return user.getIdToken()
      })
      onChange([...value, {
        id: `resource-${upload.fileId}`,
        label: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        description: '',
        kind: 'file',
        url: upload.url,
        format: fileExtension(file.name),
        fileId: upload.fileId,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        size: upload.size,
      }])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Berkas gagal diunggah.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="adp-data-resources">
      <div className="adp-data-resource-toolbar">
        <div>
          <strong>Resource terhubung</strong>
          <p>Spreadsheet cocok untuk data yang terus berubah. Unggahan cocok untuk snapshot atau laporan final.</p>
        </div>
        <div>
          <button className="adm-btn adm-btn--ghost" type="button" onClick={() => addResource('spreadsheet')}>+ Spreadsheet</button>
          <button className="adm-btn adm-btn--ghost" type="button" onClick={() => addResource('link')}>+ Tautan</button>
          <button className="adm-btn" type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            {isUploading ? 'Mengunggah…' : 'Unggah berkas'}
          </button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".pdf,.csv,.xlsx,.xls,.ods,.docx,.doc,.pptx,.ppt,.zip"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      </div>

      {error ? <p className="adp-inline-error" role="alert">{error}</p> : null}

      {value.length === 0 ? (
        <div className="adp-data-resource-empty">
          <strong>Belum ada resource.</strong>
          <p>Halaman tetap dapat diterbitkan, tetapi pembaca belum memiliki spreadsheet atau berkas untuk dibuka.</p>
        </div>
      ) : (
        <div className="adp-data-resource-list">
          {value.map((resource, index) => (
            <article className="adp-data-resource-item" key={resource.id}>
              <div className="adp-data-resource-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="adp-data-resource-fields">
                <div className="adp-field-grid">
                  <div className="adm-field">
                    <label htmlFor={`data-resource-label-${resource.id}`}>Judul resource</label>
                    <input id={`data-resource-label-${resource.id}`} value={resource.label} onChange={(event) => updateResource(resource.id, { label: event.target.value })} placeholder="Contoh: Rekap progres TRE 25" />
                  </div>
                  <div className="adm-field">
                    <label htmlFor={`data-resource-kind-${resource.id}`}>Jenis</label>
                    <select id={`data-resource-kind-${resource.id}`} value={resource.kind} disabled={resource.kind === 'file'} onChange={(event) => updateResource(resource.id, { kind: event.target.value as PublicDataResourceKind })}>
                      {Object.entries(publicDataResourceKindLabels).map(([kind, label]) => <option value={kind} key={kind}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="adm-field">
                  <label htmlFor={`data-resource-url-${resource.id}`}>{resource.kind === 'file' ? 'Alamat berkas' : 'Tautan HTTPS'}</label>
                  <input id={`data-resource-url-${resource.id}`} type="url" value={resource.url} readOnly={resource.kind === 'file'} onChange={(event) => updateResource(resource.id, { url: event.target.value })} placeholder={resource.kind === 'spreadsheet' ? 'https://docs.google.com/spreadsheets/…' : 'https://'} />
                </div>
                <div className="adp-field-grid">
                  <div className="adm-field">
                    <label htmlFor={`data-resource-description-${resource.id}`}>Keterangan</label>
                    <input id={`data-resource-description-${resource.id}`} value={resource.description} onChange={(event) => updateResource(resource.id, { description: event.target.value })} placeholder="Apa isi resource ini dan siapa yang perlu membukanya?" />
                  </div>
                  <div className="adm-field">
                    <label htmlFor={`data-resource-format-${resource.id}`}>Format / label kecil</label>
                    <input id={`data-resource-format-${resource.id}`} value={resource.format} maxLength={16} onChange={(event) => updateResource(resource.id, { format: event.target.value.toUpperCase() })} placeholder="SHEETS, XLSX, PDF" />
                  </div>
                </div>
                {resource.kind === 'file' ? <small className="adp-data-resource-filemeta">{resource.fileName} {formatBytes(resource.size) ? `· ${formatBytes(resource.size)}` : ''}</small> : null}
              </div>
              <button className="adm-btn adm-btn--ghost adp-data-resource-remove" type="button" onClick={() => onChange(value.filter((item) => item.id !== resource.id))}>Lepas</button>
            </article>
          ))}
        </div>
      )}
      <small className="adp-data-resource-note">Melepas resource dari halaman tidak menghapus berkas yang sudah diunggah dari ImageKit.</small>
    </div>
  )
}
