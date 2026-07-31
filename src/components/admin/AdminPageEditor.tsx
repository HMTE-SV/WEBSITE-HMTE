'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'
import { useAdminSession } from './AdminSessionContext'
import { canAdminWrite } from '@/data/admin-nav'
import { mediaSlotDefinitions } from '@/data/media-slots'
import {
  DEFAULT_MEDIA_PICKER_LIMIT,
  filterPickerMedia,
  mediaFolderLabels,
  type MediaFolderFilter,
} from '@/lib/admin/media-library'
import { validatePageContent } from '@/lib/admin/page-content-validation'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import {
  getContentDocument,
  listContentDocuments,
  publishPageContentDraft,
  writeContentDocumentAtId,
} from '@/lib/firebase/content-services'
import {
  getDefaultPageContent,
  getPageDefinition,
  normalizePageContent,
  type PageContent,
  type PageKey,
} from '@/lib/page-content'
import type {
  MediaDocument,
  MediaSlotDocument,
  PageContentDocument,
  PageContentDraftDocument,
} from '@/types/firestore'

type EditorPanel = 'seo' | string

function seedMediaAssignments(content: PageContent, slots: MediaSlotDocument[]) {
  const assignments = { ...content.mediaAssignments }
  const allowedKeys = new Set(getPageDefinition(content.pageKey).sections.flatMap((section) => section.mediaSlotKeys))
  for (const slot of slots) {
    if (allowedKeys.has(slot.slotKey) && !(slot.slotKey in assignments) && slot.mediaId) assignments[slot.slotKey] = slot.mediaId
  }
  return { ...content, mediaAssignments: assignments }
}

function formatTimestamp(value: PageContentDraftDocument['lastPublishedAt']) {
  if (!value) return 'Belum pernah diterbitkan dari editor ini'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar',
  }).format(value.toDate())
}

export function AdminPageEditor({ pageKey }: { pageKey: PageKey }) {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const isSuperadmin = session.role === 'superadmin'
  const definition = getPageDefinition(pageKey)
  const defaultContent = useMemo(() => getDefaultPageContent(pageKey), [pageKey])
  const [content, setContent] = useState(defaultContent)
  const [published, setPublished] = useState(defaultContent)
  const [loadedSnapshot, setLoadedSnapshot] = useState(JSON.stringify(defaultContent))
  const [activePanel, setActivePanel] = useState<EditorPanel>('seo')
  const [media, setMedia] = useState<MediaDocument[]>([])
  const [draftExists, setDraftExists] = useState(false)
  const [publicationState, setPublicationState] = useState<'draft' | 'published'>('published')
  const [lastPublishedAt, setLastPublishedAt] = useState<PageContentDraftDocument['lastPublishedAt']>()
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyAction, setBusyAction] = useState<'save' | 'publish' | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [mediaFolder, setMediaFolder] = useState<MediaFolderFilter>('situs')
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaLimit, setMediaLimit] = useState(DEFAULT_MEDIA_PICKER_LIMIT)

  useEffect(() => {
    if (!hasFirebaseConfig()) return
    let cancelled = false
    Promise.all([
      getContentDocument<PageContentDocument>('pageContents', pageKey),
      getContentDocument<PageContentDraftDocument>('pageContentDrafts', pageKey),
      listContentDocuments<MediaDocument>('media'),
      listContentDocuments<MediaSlotDocument>('mediaSlots'),
    ]).then(([publishedDocument, draftDocument, mediaItems, slots]) => {
      if (cancelled) return
      const publishedContent = seedMediaAssignments(
        normalizePageContent(publishedDocument as Record<string, unknown> | null, pageKey),
        slots,
      )
      const workingContent = seedMediaAssignments(
        normalizePageContent((draftDocument ?? publishedDocument) as Record<string, unknown> | null, pageKey),
        slots,
      )
      setPublished(publishedContent)
      setContent(workingContent)
      setLoadedSnapshot(JSON.stringify(workingContent))
      setMedia(mediaItems.filter((item) => item.status === 'active'))
      setDraftExists(Boolean(draftDocument))
      setPublicationState(draftDocument?.publicationState ?? 'published')
      setLastPublishedAt(draftDocument?.lastPublishedAt)
      setIsLoading(false)
    }).catch((loadError: unknown) => {
      if (cancelled) return
      setError(loadError instanceof Error ? loadError.message : 'Konten halaman gagal dimuat.')
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [pageKey])

  const hasLocalChanges = JSON.stringify(content) !== loadedSnapshot
  const differsFromPublished = JSON.stringify(content) !== JSON.stringify(published)
  const validation = useMemo(() => validatePageContent(content), [content])
  const mediaPicker = useMemo(
    () => filterPickerMedia(media, { folder: mediaFolder, query: mediaQuery, limit: mediaLimit }),
    [media, mediaFolder, mediaLimit, mediaQuery],
  )
  useUnsavedChangesGuard(hasLocalChanges)

  const statusLabel = hasLocalChanges
    ? 'Perubahan lokal belum disimpan'
    : differsFromPublished || publicationState === 'draft'
      ? 'Draft tersimpan, belum terbit'
      : 'Sinkron dengan website publik'
  const activeSection = content.sections.find((section) => section.id === activePanel)
  const activeDefinition = definition.sections.find((section) => section.id === activePanel)

  function clearMessages() { setError(''); setFeedback('') }

  function updateSection(sectionId: string, updater: (section: PageContent['sections'][number]) => PageContent['sections'][number]) {
    setContent((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? updater(section) : section),
    }))
    clearMessages()
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setContent((current) => {
      const ordered = [...current.sections].sort((a, b) => a.order - b.order)
      const index = ordered.findIndex((section) => section.id === sectionId)
      const target = ordered[index + direction]
      const sourceDefinition = definition.sections.find((section) => section.id === sectionId)
      const targetDefinition = target && definition.sections.find((section) => section.id === target.id)
      if (index < 0 || !target || sourceDefinition?.lockedPosition || targetDefinition?.lockedPosition) return current
      ;[ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]]
      return { ...current, sections: ordered.map((section, order) => ({ ...section, order })) }
    })
    clearMessages()
  }

  function updateMedia(slotKey: string, mediaId: string) {
    setContent((current) => ({
      ...current,
      mediaAssignments: { ...current.mediaAssignments, [slotKey]: mediaId },
    }))
    clearMessages()
  }

  async function saveDraft() {
    setBusyAction('save'); clearMessages()
    try {
      await writeContentDocumentAtId<PageContentDraftDocument>(
        'pageContentDrafts', pageKey,
        { ...content, publicationState: 'draft', updatedBy: session.email },
        draftExists,
      )
      setLoadedSnapshot(JSON.stringify(content))
      setDraftExists(true)
      setPublicationState('draft')
      setFeedback('Draft tersimpan. Website publik belum berubah.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Draft gagal disimpan.')
    } finally { setBusyAction(null) }
  }

  async function publish() {
    setValidationAttempted(true)
    clearMessages()
    if (!validation.success) {
      setActivePanel(validation.issues[0].panelId)
      setError(`Publikasi ditahan. Perbaiki ${validation.issues.length} field yang belum valid.`)
      return
    }

    setBusyAction('publish')
    try {
      await publishPageContentDraft(content, session.email)
      await requestRevalidation('pages')
      setPublished(content)
      setLoadedSnapshot(JSON.stringify(content))
      setDraftExists(true)
      setPublicationState('published')
      setLastPublishedAt(Timestamp.now())
      setValidationAttempted(false)
      setFeedback('Versi baru diterbitkan. Beranda dan Kontak sedang disegarkan.')
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Halaman gagal diterbitkan.')
    } finally { setBusyAction(null) }
  }

  return (
    <AdminShell activeHref="/admin/pages" kicker="Page CMS" title={`Edit ${definition.label}`} description={definition.description}>
      {!hasFirebaseConfig() ? (
        <AdminEmptyState kicker="Konfigurasi" title="Firebase belum siap." body="Isi .env.local agar draft dan versi terbit dapat dimuat." />
      ) : isLoading ? (
        <AdminEmptyState kicker="Memuat" title="Mengambil konten halaman..." body="Membaca versi terbit, draft, dan pustaka media." />
      ) : (
        <div className="admin-page-editor-workspace">
          {!canWrite ? <p className="admin-form-error" role="status">Mode viewer aktif. Konten dapat diperiksa, tetapi seluruh isian dikunci.</p> : null}
          <section className="admin-settings-status" aria-label="Status publikasi">
            <div><span className={`admin-settings-status-dot ${differsFromPublished || hasLocalChanges ? 'is-draft' : 'is-live'}`} /><div><small>Status dokumen</small><strong>{statusLabel}</strong></div></div>
            <dl><div><dt>Terakhir terbit</dt><dd>{formatTimestamp(lastPublishedAt)}</dd></div><div><dt>Alamat publik</dt><dd>{definition.path}</dd></div></dl>
          </section>

          <div className="admin-page-editor-layout">
            <aside className="admin-page-editor-outline">
              <Link href="/admin/pages">← Semua halaman</Link>
              <button type="button" className={activePanel === 'seo' ? 'is-active' : ''} onClick={() => setActivePanel('seo')}><span>00</span><b>SEO & publikasi</b>{validationAttempted && validation.issues.some((issue) => issue.panelId === 'seo') ? <i className="is-error">Perlu diperbaiki</i> : null}</button>
              {[...content.sections].sort((a, b) => a.order - b.order).map((section, index) => {
                const sectionDefinition = definition.sections.find((item) => item.id === section.id)
                const issueCount = validation.issues.filter((issue) => issue.panelId === section.id).length
                return <button type="button" data-invalid={validationAttempted && issueCount > 0} className={activePanel === section.id ? 'is-active' : ''} onClick={() => setActivePanel(section.id)} key={section.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span><b>{section.label}</b><i>{section.visible ? 'Tampil' : 'Disembunyikan'}{sectionDefinition?.lockedPosition ? ' · tetap' : ''}</i>
                </button>
              })}
            </aside>

            <form className="admin-page-editor-form" onSubmit={(event) => event.preventDefault()}>
              {activePanel === 'seo' ? (
                <section className="admin-page-editor-section">
                  <header><span>00 / Metadata</span><h2>Bagaimana halaman ini muncul di pencarian?</h2><p>Metadata ini khusus {definition.label} dan menggantikan nilai global bila halaman diterbitkan.</p></header>
                  <label className={`admin-field ${validationAttempted && validation.issues.some((issue) => issue.path === 'seoTitle') ? 'has-error' : ''}`}><span>Judul SEO</span><input aria-invalid={validationAttempted && validation.issues.some((issue) => issue.path === 'seoTitle')} disabled={!canWrite} maxLength={65} value={content.seoTitle} onChange={(event) => { setContent({ ...content, seoTitle: event.target.value }); clearMessages() }} /><small>{content.seoTitle.length}/65 karakter</small>{validationAttempted ? validation.issues.filter((issue) => issue.path === 'seoTitle').map((issue) => <em className="admin-field-error" key={issue.message}>{issue.message}</em>) : null}</label>
                  <label className={`admin-field ${validationAttempted && validation.issues.some((issue) => issue.path === 'seoDescription') ? 'has-error' : ''}`}><span>Deskripsi SEO</span><textarea aria-invalid={validationAttempted && validation.issues.some((issue) => issue.path === 'seoDescription')} disabled={!canWrite} maxLength={170} value={content.seoDescription} onChange={(event) => { setContent({ ...content, seoDescription: event.target.value }); clearMessages() }} /><small>{content.seoDescription.length}/170 karakter</small>{validationAttempted ? validation.issues.filter((issue) => issue.path === 'seoDescription').map((issue) => <em className="admin-field-error" key={issue.message}>{issue.message}</em>) : null}</label>
                  <div className="admin-page-serp-preview"><small>Pratinjau hasil pencarian</small><strong>{content.seoTitle}</strong><span>{definition.path}</span><p>{content.seoDescription}</p></div>
                  <div className="admin-page-structure-preview"><small>Urutan publik</small>{[...content.sections].sort((a, b) => a.order - b.order).map((section) => <span data-visible={section.visible} key={section.id}>{section.order + 1}. {section.label}</span>)}</div>
                </section>
              ) : activeSection && activeDefinition ? (
                <section className="admin-page-editor-section">
                  <header><span>{String(activeSection.order + 1).padStart(2, '0')} / Section</span><h2>{activeSection.label}</h2><p>{activeDefinition.description}</p></header>
                  <div className="admin-page-section-controls">
                    <label><input type="checkbox" disabled={!canWrite} checked={activeSection.visible} onChange={(event) => updateSection(activeSection.id, (section) => ({ ...section, visible: event.target.checked }))} /><span>Tampilkan section</span></label>
                    <div><button type="button" disabled={!canWrite || Boolean(activeDefinition.lockedPosition) || activeSection.order === 0} onClick={() => moveSection(activeSection.id, -1)}>↑ Naik</button><button type="button" disabled={!canWrite || Boolean(activeDefinition.lockedPosition) || activeSection.order === content.sections.length - 1} onClick={() => moveSection(activeSection.id, 1)}>↓ Turun</button></div>
                  </div>
                  {activeDefinition.lockedPosition ? <p className="admin-field-hint">Posisi section ini dikunci karena menjadi bagian dari struktur pembuka halaman.</p> : null}
                  <div className="admin-page-field-stack">
                    {activeDefinition.fields.map((field) => {
                      const path = `${activeSection.id}.${field.key}`
                      const fieldIssues = validation.issues.filter((issue) => issue.path === path)
                      const maximum = field.type === 'textarea' ? 1200 : field.type === 'url' ? 2048 : 180
                      return <label className={`admin-field ${validationAttempted && fieldIssues.length ? 'has-error' : ''}`} key={field.key}>
                        <span>{field.label}</span>
                        {field.type === 'textarea'
                          ? <textarea aria-invalid={validationAttempted && fieldIssues.length > 0} disabled={!canWrite} maxLength={maximum} rows={4} value={activeSection.fields[field.key] ?? ''} onChange={(event) => updateSection(activeSection.id, (section) => ({ ...section, fields: { ...section.fields, [field.key]: event.target.value } }))} />
                          : <input aria-invalid={validationAttempted && fieldIssues.length > 0} type={field.type === 'url' ? 'text' : field.type} disabled={!canWrite} maxLength={maximum} value={activeSection.fields[field.key] ?? ''} onChange={(event) => updateSection(activeSection.id, (section) => ({ ...section, fields: { ...section.fields, [field.key]: event.target.value } }))} />}
                        {field.help ? <small>{field.help}</small> : null}
                        {field.type === 'url' ? <small>Boleh berupa /path-internal, #anchor, mailto:, tel:, atau URL HTTP/HTTPS.</small> : null}
                        {validationAttempted ? fieldIssues.map((issue) => <em className="admin-field-error" key={issue.message}>{issue.message}</em>) : null}
                      </label>
                    })}
                  </div>
                  {activeDefinition.mediaSlotKeys.length ? (
                    <div className="admin-page-media-section">
                      <header><div><span>Gambar bernama</span><h3>Media untuk section ini</h3></div><Link href="/admin/media">Kelola pustaka ↗</Link></header>
                      {!isSuperadmin ? <p className="admin-field-hint">Editor dapat mengubah teks. Penugasan gambar dikunci untuk superadmin agar slot publik tidak tertimpa tanpa pemeriksaan.</p> : null}
                      <div className="admin-page-media-filters">
                        <label><span>Cari gambar</span><input type="search" value={mediaQuery} onChange={(event) => { setMediaQuery(event.target.value); setMediaLimit(DEFAULT_MEDIA_PICKER_LIMIT) }} placeholder="Nama file, alt, atau kredit" /></label>
                        <label><span>Kategori</span><select value={mediaFolder} onChange={(event) => { setMediaFolder(event.target.value as MediaFolderFilter); setMediaLimit(DEFAULT_MEDIA_PICKER_LIMIT) }}><option value="all">Semua kategori</option>{Object.entries(mediaFolderLabels).map(([value, label]) => <option value={value} key={value}>{label}{value === 'situs' ? ' · disarankan' : ''}</option>)}</select></label>
                        <small>{mediaPicker.items.length} dari {mediaPicker.total} gambar</small>
                      </div>
                      <div className="admin-page-media-grid">
                        {activeDefinition.mediaSlotKeys.map((slotKey) => {
                          const slotDefinition = mediaSlotDefinitions.find((slot) => slot.key === slotKey)
                          const selected = media.find((item) => item.id === content.mediaAssignments[slotKey])
                          const availableMedia = selected && !mediaPicker.items.some((item) => item.id === selected.id)
                            ? [selected, ...mediaPicker.items]
                            : mediaPicker.items
                          return <article key={slotKey}>
                            <div>{selected ? <Image src={selected.thumbnailUrl || selected.url} alt={selected.alt} width={180} height={110} /> : <span>Fallback</span>}</div>
                            <label><b>{slotDefinition?.label ?? slotKey}</b><select disabled={!isSuperadmin} value={content.mediaAssignments[slotKey] ?? ''} onChange={(event) => updateMedia(slotKey, event.target.value)}><option value="">Pakai gambar bawaan</option>{availableMedia.map((item) => <option value={item.id} key={item.id}>{item.originalFileName || item.fileName} · {mediaFolderLabels[item.folder]}</option>)}</select></label>
                          </article>
                        })}
                      </div>
                      {mediaPicker.items.length < mediaPicker.total ? <button className="admin-secondary-button admin-page-media-more" type="button" onClick={() => setMediaLimit((current) => current + DEFAULT_MEDIA_PICKER_LIMIT)}>Tampilkan {Math.min(DEFAULT_MEDIA_PICKER_LIMIT, mediaPicker.total - mediaPicker.items.length)} gambar lagi</button> : null}
                    </div>
                  ) : null}
                  <div className="admin-page-copy-preview"><small>Pratinjau isi section</small><strong>{activeSection.label}</strong>{Object.values(activeSection.fields).slice(0, 4).map((value, index) => <p key={index}>{value}</p>)}</div>
                </section>
              ) : null}

              {validationAttempted && !validation.success ? <div className="admin-validation-summary" role="alert"><strong>Halaman belum siap diterbitkan.</strong><ul>{validation.issues.map((issue) => <li key={`${issue.path}-${issue.message}`}><button type="button" onClick={() => setActivePanel(issue.panelId)}>{issue.message}</button></li>)}</ul></div> : null}
              {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
              {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}
              <footer className="admin-settings-actions">
                <div><strong>{hasLocalChanges ? 'Ada perubahan lokal' : differsFromPublished ? 'Draft siap diterbitkan' : 'Tidak ada perubahan'}</strong><span>Publish dan restore tercatat di Riwayat Perubahan.</span></div>
                <Link className="admin-secondary-button" href={definition.path} target="_blank">Lihat versi terbit ↗</Link>
                <button className="admin-secondary-button" type="button" disabled={!canWrite || busyAction !== null || !hasLocalChanges} onClick={() => void saveDraft()}>{busyAction === 'save' ? 'Menyimpan...' : 'Simpan draft'}</button>
                <button className="admin-primary-button" type="button" disabled={!canWrite || busyAction !== null || (!differsFromPublished && !hasLocalChanges)} onClick={() => void publish()}>{busyAction === 'publish' ? 'Menerbitkan...' : 'Terbitkan'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
