'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'
import { useAdminSession } from './AdminSessionContext'
import { canAdminWrite } from '@/data/admin-nav'
import { mediaSlotDefinitions } from '@/data/media-slots'
import { uploadImageToImageKit, type ImageKitFolder } from '@/lib/admin/imagekit-upload'
import {
  DEFAULT_MEDIA_PICKER_LIMIT,
  filterPickerMedia,
  mediaFolderLabels as folderLabels,
  mediaMatchesSearch,
  registerUploadedMedia,
  type MediaFolderFilter,
} from '@/lib/admin/media-library'
import { buildPublicMediaProjection, syncMediaSlotProjections } from '@/lib/admin/media-slot-sync'
import { validateGalleryImage } from '@/lib/admin/media-validation'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { getFirebaseAuth, hasFirebaseConfig } from '@/lib/firebase/client'
import {
  getContentDocument,
  listContentDocuments,
  updateContentDocument,
  writeContentDocumentAtId,
} from '@/lib/firebase/content-services'
import type {
  MediaConsentStatus,
  MediaDocument,
  MediaSlotDocument,
} from '@/types/firestore'

type MediaTab = 'library' | 'slots'
type EditValues = Pick<
  MediaDocument,
  'alt' | 'caption' | 'credit' | 'consentStatus' | 'focalPointX' | 'focalPointY' | 'folder'
>

const emptyEditValues: EditValues = {
  alt: '',
  caption: '',
  consentStatus: 'unknown',
  credit: '',
  focalPointX: 50,
  focalPointY: 50,
  folder: 'situs',
}

function mediaTimestamp(item: MediaDocument) {
  return item.createdAt?.toMillis?.() ?? 0
}

function fileSizeLabel(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function toEditValues(media: MediaDocument): EditValues {
  return {
    alt: media.alt,
    caption: media.caption,
    consentStatus: media.consentStatus,
    credit: media.credit,
    focalPointX: media.focalPointX,
    focalPointY: media.focalPointY,
    folder: media.folder,
  }
}

export function AdminMediaManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const isSuperadmin = session.role === 'superadmin'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedIdRef = useRef('')
  const [tab, setTab] = useState<MediaTab>('library')
  const [items, setItems] = useState<MediaDocument[]>([])
  const [slots, setSlots] = useState<MediaSlotDocument[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState<'all' | ImageKitFolder>('all')
  const [slotFolder, setSlotFolder] = useState<MediaFolderFilter>('situs')
  const [slotQuery, setSlotQuery] = useState('')
  const [slotLimit, setSlotLimit] = useState(DEFAULT_MEDIA_PICKER_LIMIT)
  const [uploadFolder, setUploadFolder] = useState<ImageKitFolder>('situs')
  const [editValues, setEditValues] = useState<EditValues>(emptyEditValues)
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isUploading, setIsUploading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadWorkspace = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const [mediaItems, slotItems] = await Promise.all([
        listContentDocuments<MediaDocument>('media'),
        listContentDocuments<MediaSlotDocument>('mediaSlots'),
      ])
      const sorted = [...mediaItems].sort((first, second) => mediaTimestamp(second) - mediaTimestamp(first))
      setItems(sorted)
      setSlots(slotItems)
      const nextSelectedId = selectedIdRef.current || sorted[0]?.id || ''
      const nextSelected = sorted.find((item) => item.id === nextSelectedId)
      selectedIdRef.current = nextSelectedId
      setSelectedId(nextSelectedId)
      setEditValues(nextSelected ? toEditValues(nextSelected) : emptyEditValues)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Pustaka media gagal dimuat.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadWorkspace(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadWorkspace])

  const selected = items.find((item) => item.id === selectedId) ?? null
  const hasMetadataChanges = Boolean(selected) && JSON.stringify(editValues) !== JSON.stringify(toEditValues(selected!))
  useUnsavedChangesGuard(hasMetadataChanges)

  function selectMedia(item: MediaDocument) {
    if (hasMetadataChanges && !window.confirm('Metadata gambar ini belum disimpan. Tetap pindah ke gambar lain?')) return
    selectedIdRef.current = item.id
    setSelectedId(item.id)
    setEditValues(toEditValues(item))
  }

  const visibleItems = useMemo(
    () => items.filter((item) => (folder === 'all' || item.folder === folder) && mediaMatchesSearch(item, query)),
    [folder, items, query],
  )

  const mediaById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const slotPicker = useMemo(
    () => filterPickerMedia(items, { folder: slotFolder, query: slotQuery, limit: slotLimit }),
    [items, slotFolder, slotLimit, slotQuery],
  )

  async function handleUpload(file: File | undefined) {
    if (!file || !canWrite) return
    const validation = validateGalleryImage(file)
    if (!validation.success) {
      setError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)
    setError('')
    setFeedback('')
    try {
      const upload = await uploadImageToImageKit(file, uploadFolder, async () => {
        const currentUser = getFirebaseAuth().currentUser
        if (!currentUser) throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        return currentUser.getIdToken()
      })
      const registered = await registerUploadedMedia(upload, file, uploadFolder)
      selectedIdRef.current = registered.id
      setSelectedId(registered.id)
      setFeedback('Gambar terunggah dan sudah terdaftar di pustaka media.')
      await loadWorkspace()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Gambar gagal diunggah.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function saveMetadata() {
    if (!selected || !canWrite) return
    setBusyId(selected.id)
    setError('')
    setFeedback('')
    try {
      await updateContentDocument<MediaDocument>('media', selected.id, {
        alt: editValues.alt.trim(),
        caption: editValues.caption.trim(),
        consentStatus: editValues.consentStatus,
        credit: editValues.credit.trim(),
        focalPointX: Math.min(100, Math.max(0, Number(editValues.focalPointX))),
        focalPointY: Math.min(100, Math.max(0, Number(editValues.focalPointY))),
        folder: editValues.folder,
      })
      try {
        await syncMediaSlotProjections(selected.id)
        await requestRevalidation('media')
        setFeedback('Metadata media tersimpan dan slot publik tersinkron.')
      } catch {
        setFeedback('Metadata media tersimpan, tetapi proyeksi slot publik belum tersinkron. Coba simpan lagi setelah rules terbaru aktif.')
      }
      await loadWorkspace()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Metadata gagal disimpan.')
    } finally {
      setBusyId('')
    }
  }

  async function toggleArchive(item: MediaDocument) {
    if (!canWrite) return
    setBusyId(item.id)
    setError('')
    try {
      await updateContentDocument<MediaDocument>('media', item.id, {
        status: item.status === 'active' ? 'archived' : 'active',
      })
      try {
        await syncMediaSlotProjections(item.id)
        await requestRevalidation('media')
        setFeedback(item.status === 'active' ? 'Media diarsipkan.' : 'Media diaktifkan kembali.')
      } catch {
        setFeedback('Status media tersimpan, tetapi proyeksi slot publik belum tersinkron. Coba lagi setelah rules terbaru aktif.')
      }
      await loadWorkspace()
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Status media gagal diubah.')
    } finally {
      setBusyId('')
    }
  }

  async function copyUrl(item: MediaDocument) {
    await navigator.clipboard.writeText(item.url)
    setFeedback(`URL ${item.originalFileName} disalin.`)
  }

  async function saveSlot(slotKey: string, mediaId: string) {
    if (!isSuperadmin) return
    const definition = mediaSlotDefinitions.find((item) => item.key === slotKey)
    if (!definition) return

    setBusyId(slotKey)
    setError('')
    setFeedback('')
    try {
      const existing = await getContentDocument<MediaSlotDocument>('mediaSlots', slotKey)
      const assignedMedia = mediaId ? mediaById.get(mediaId) : undefined
      await writeContentDocumentAtId<MediaSlotDocument>(
        'mediaSlots',
        slotKey,
        {
          description: definition.description,
          fallbackUrl: definition.fallbackUrl,
          label: definition.label,
          mediaId,
          slotKey,
          ...buildPublicMediaProjection(assignedMedia),
        },
        Boolean(existing),
      )
      await requestRevalidation('media')
      setFeedback(`Slot “${definition.label}” diperbarui.`)
      await loadWorkspace()
    } catch (slotError) {
      setError(slotError instanceof Error ? slotError.message : 'Slot media gagal disimpan.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell
      activeHref="/admin/media"
      kicker="Media system"
      title="Pustaka media"
      description="Satu tempat untuk mengunggah, memberi metadata, memakai ulang, dan menempatkan gambar ke slot situs."
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState kicker="Konfigurasi" title="Firebase belum siap." body="Isi .env.local agar media dan slot dapat disimpan." />
      ) : (
        <>
          <div className="admin-media-mode" role="tablist" aria-label="Mode pustaka media">
            <button type="button" role="tab" aria-selected={tab === 'library'} onClick={() => setTab('library')}>
              Library <span>{items.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'slots'} onClick={() => setTab('slots')}>
              Slot situs <span>{mediaSlotDefinitions.length}</span>
            </button>
          </div>

          {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
          {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}

          {tab === 'library' ? (
            <>
              <div className="admin-media-toolbar">
                <label>
                  <span className="sr-only">Cari media</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, alt, kredit..." />
                </label>
                <select value={folder} onChange={(event) => setFolder(event.target.value as 'all' | ImageKitFolder)} aria-label="Saring folder">
                  <option value="all">Semua folder</option>
                  {Object.entries(folderLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                {canWrite ? (
                  <div className="admin-media-upload">
                    <select value={uploadFolder} onChange={(event) => setUploadFolder(event.target.value as ImageKitFolder)} aria-label="Folder unggahan">
                      {Object.entries(folderLabels).map(([value, label]) => <option value={value} key={value}>Ke {label}</option>)}
                    </select>
                    <button className="admin-primary-button" type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                      {isUploading ? 'Mengunggah...' : 'Unggah media'}
                    </button>
                    <input
                      className="admin-visually-hidden"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => void handleUpload(event.target.files?.[0])}
                    />
                  </div>
                ) : null}
              </div>

              {isLoading ? (
                <AdminEmptyState kicker="Memuat" title="Mengambil pustaka..." body="Membaca metadata media dari Firestore." />
              ) : visibleItems.length === 0 ? (
                <AdminEmptyState kicker="Media" title="Belum ada media yang cocok." body="Unggah gambar atau ubah kata pencarian dan filter folder." />
              ) : (
                <div className="admin-media-layout">
                  <div className="admin-media-grid">
                    {visibleItems.map((item) => (
                      <button
                        type="button"
                        className={item.id === selected?.id ? 'is-active' : undefined}
                        data-status={item.status}
                        onClick={() => selectMedia(item)}
                        key={item.id}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnailUrl || item.url} alt="" />
                        <span><strong>{item.alt || item.originalFileName}</strong><small>{folderLabels[item.folder]} · {fileSizeLabel(item.size)}</small></span>
                      </button>
                    ))}
                  </div>

                  {selected ? (
                    <aside className="admin-media-inspector">
                      <figure>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.url}
                          alt=""
                          style={{ objectPosition: `${editValues.focalPointX}% ${editValues.focalPointY}%` }}
                        />
                        <figcaption>{selected.width || '—'} × {selected.height || '—'} px</figcaption>
                      </figure>
                      <header><span>{folderLabels[selected.folder]}</span><h2>{selected.originalFileName}</h2></header>
                      <div className="admin-field"><label htmlFor="media-alt">Alt</label><input id="media-alt" disabled={!canWrite} value={editValues.alt} onChange={(event) => setEditValues((current) => ({ ...current, alt: event.target.value }))} /></div>
                      <div className="admin-field"><label htmlFor="media-caption">Caption</label><textarea id="media-caption" disabled={!canWrite} value={editValues.caption} onChange={(event) => setEditValues((current) => ({ ...current, caption: event.target.value }))} rows={3} /></div>
                      <div className="admin-form-grid">
                        <div className="admin-field"><label htmlFor="media-credit">Kredit</label><input id="media-credit" disabled={!canWrite} value={editValues.credit} onChange={(event) => setEditValues((current) => ({ ...current, credit: event.target.value }))} /></div>
                        <div className="admin-field"><label htmlFor="media-consent">Izin publikasi</label><select id="media-consent" disabled={!canWrite} value={editValues.consentStatus} onChange={(event) => setEditValues((current) => ({ ...current, consentStatus: event.target.value as MediaConsentStatus }))}><option value="unknown">Belum diperiksa</option><option value="confirmed">Sudah dikonfirmasi</option><option value="not_required">Tidak diperlukan</option></select></div>
                        <div className="admin-field"><label htmlFor="media-folder">Kategori</label><select id="media-folder" disabled={!canWrite} value={editValues.folder} onChange={(event) => setEditValues((current) => ({ ...current, folder: event.target.value as ImageKitFolder }))}>{Object.entries(folderLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><small>Menentukan kelompok gambar di semua pemilih media.</small></div>
                      </div>
                      <div className="admin-media-focus">
                        <label>Fokus horizontal <input type="range" min="0" max="100" disabled={!canWrite} value={editValues.focalPointX} onChange={(event) => setEditValues((current) => ({ ...current, focalPointX: Number(event.target.value) }))} /></label>
                        <label>Fokus vertikal <input type="range" min="0" max="100" disabled={!canWrite} value={editValues.focalPointY} onChange={(event) => setEditValues((current) => ({ ...current, focalPointY: Number(event.target.value) }))} /></label>
                      </div>
                      <div className="admin-media-actions">
                        {canWrite ? <button className="admin-primary-button" type="button" disabled={busyId === selected.id} onClick={() => void saveMetadata()}>Simpan metadata</button> : null}
                        <button className="admin-secondary-button" type="button" onClick={() => void copyUrl(selected)}>Salin URL</button>
                        {canWrite ? <button className="admin-secondary-button" type="button" disabled={busyId === selected.id} onClick={() => void toggleArchive(selected)}>{selected.status === 'active' ? 'Arsipkan' : 'Aktifkan'}</button> : null}
                      </div>
                    </aside>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <div className="admin-slot-groups">
              <div className="admin-slot-media-filters">
                <label><span>Cari gambar slot</span><input type="search" value={slotQuery} onChange={(event) => { setSlotQuery(event.target.value); setSlotLimit(DEFAULT_MEDIA_PICKER_LIMIT) }} placeholder="Nama file, alt, atau kredit" /></label>
                <label><span>Kategori</span><select value={slotFolder} onChange={(event) => { setSlotFolder(event.target.value as MediaFolderFilter); setSlotLimit(DEFAULT_MEDIA_PICKER_LIMIT) }}><option value="all">Semua kategori</option>{Object.entries(folderLabels).map(([value, label]) => <option value={value} key={value}>{label}{value === 'situs' ? ' · disarankan' : ''}</option>)}</select></label>
                <p>Menampilkan {slotPicker.items.length} dari {slotPicker.total} gambar aktif.</p>
                {slotPicker.items.length < slotPicker.total ? <button className="admin-secondary-button" type="button" onClick={() => setSlotLimit((current) => current + DEFAULT_MEDIA_PICKER_LIMIT)}>Tampilkan {Math.min(DEFAULT_MEDIA_PICKER_LIMIT, slotPicker.total - slotPicker.items.length)} lagi</button> : null}
              </div>
              {(['Brand', 'Beranda', 'Kontak', 'Organisasi', 'SEO'] as const).map((group) => (
                <section key={group}>
                  <header><span>Slot</span><h2>{group}</h2></header>
                  <div className="admin-slot-list">
                    {mediaSlotDefinitions.filter((definition) => definition.group === group).map((definition) => {
                      const stored = slots.find((slot) => slot.id === definition.key)
                      const assigned = stored?.mediaId ? mediaById.get(stored.mediaId) : undefined
                      const previewUrl = assigned?.url || definition.fallbackUrl
                      const availableMedia = assigned && !slotPicker.items.some((item) => item.id === assigned.id)
                        ? [assigned, ...slotPicker.items]
                        : slotPicker.items

                      return (
                        <article key={definition.key}>
                          <div className="admin-slot-preview">
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previewUrl} alt="" />
                            ) : <span>Belum ada gambar</span>}
                          </div>
                          <div><code>{definition.key}</code><h3>{definition.label}</h3><p>{definition.description}</p></div>
                          <label>
                            <span className="sr-only">Media untuk {definition.label}</span>
                            <select
                              disabled={!isSuperadmin || busyId === definition.key}
                              value={stored?.mediaId || ''}
                              onChange={(event) => void saveSlot(definition.key, event.target.value)}
                            >
                              <option value="">Gunakan fallback</option>
                              {availableMedia.map((item) => (
                                <option value={item.id} key={item.id}>{item.alt || item.originalFileName} · {folderLabels[item.folder]}</option>
                              ))}
                            </select>
                          </label>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
              {!isSuperadmin ? <p className="admin-field-hint">Slot global dapat dilihat semua admin, tetapi hanya superadmin yang boleh mengubah penempatannya.</p> : null}
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}
