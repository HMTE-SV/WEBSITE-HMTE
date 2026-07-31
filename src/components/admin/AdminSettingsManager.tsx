'use client'

import { useEffect, useMemo, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { validateSiteSettings } from '@/lib/admin/site-settings-validation'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument, publishSiteSettingsDraft, writeContentDocumentAtId } from '@/lib/firebase/content-services'
import { SITE_SETTINGS_ID } from '@/lib/site-settings-data'
import {
  defaultSiteSettings, formatCabinetTitle, formatPeriodTitle, instagramLabel,
  normalizeInstagramHandle, normalizeSiteSettings, siteChannelKeys,
  type SiteFooterColumn, type SiteFooterLink, type SiteNavigationItem,
  type SiteNavigationLink, type SiteSettings,
} from '@/lib/site-settings'
import type { SiteSettingsDocument, SiteSettingsDraftDocument } from '@/types/firestore'

type FormValues = Omit<SiteSettings, 'agendaYear'> & { agendaYear: string }
type EditorTab = 'identity' | 'channels' | 'header' | 'footer' | 'seo'

const editorTabs: Array<{ id: EditorTab; label: string; number: string }> = [
  { id: 'identity', label: 'Identitas', number: '01' },
  { id: 'channels', label: 'Kanal resmi', number: '02' },
  { id: 'header', label: 'Header', number: '03' },
  { id: 'footer', label: 'Footer', number: '04' },
  { id: 'seo', label: 'SEO', number: '05' },
]

function toFormValues(settings: SiteSettings): FormValues {
  return { ...settings, agendaYear: String(settings.agendaYear) }
}

function toSettings(values: FormValues) {
  return normalizeSiteSettings({ ...values, agendaYear: Number(values.agendaYear) })
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}

function formatTimestamp(value: SiteSettingsDraftDocument['lastPublishedAt']) {
  if (!value) return 'Belum tercatat'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar',
  }).format(value.toDate())
}

export function AdminSettingsManager() {
  const session = useAdminSession()
  const isSuperadmin = session.role === 'superadmin'
  const [activeTab, setActiveTab] = useState<EditorTab>('identity')
  const [values, setValues] = useState<FormValues>(() => toFormValues(defaultSiteSettings))
  const [published, setPublished] = useState(defaultSiteSettings)
  const [loadedSnapshot, setLoadedSnapshot] = useState(JSON.stringify(defaultSiteSettings))
  const [draftExists, setDraftExists] = useState(false)
  const [lastPublishedAt, setLastPublishedAt] = useState<SiteSettingsDraftDocument['lastPublishedAt']>()
  const [publicationState, setPublicationState] = useState<'draft' | 'published'>('published')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyAction, setBusyAction] = useState<'save' | 'publish' | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [validationAttempted, setValidationAttempted] = useState(false)

  useEffect(() => {
    if (!hasFirebaseConfig()) return
    let cancelled = false

    Promise.all([
      getContentDocument<SiteSettingsDocument>('settings', SITE_SETTINGS_ID),
      getContentDocument<SiteSettingsDraftDocument>('siteSettingsDrafts', SITE_SETTINGS_ID),
    ])
      .then(([publishedDocument, draftDocument]) => {
        if (cancelled) return
        const publishedSettings = normalizeSiteSettings(publishedDocument as Record<string, unknown> | null)
        const workingSettings = normalizeSiteSettings((draftDocument ?? publishedDocument) as Record<string, unknown> | null)
        setPublished(publishedSettings)
        setValues(toFormValues(workingSettings))
        setLoadedSnapshot(JSON.stringify(workingSettings))
        setDraftExists(Boolean(draftDocument))
        setLastPublishedAt(draftDocument?.lastPublishedAt)
        setPublicationState(draftDocument?.publicationState ?? 'published')
        setIsLoading(false)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan.')
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const preview = useMemo(() => toSettings(values), [values])
  const validationInput = useMemo(() => ({ ...values, agendaYear: Number(values.agendaYear) }), [values])
  const validation = useMemo(() => validateSiteSettings(validationInput), [validationInput])
  const hasLocalChanges = JSON.stringify(preview) !== loadedSnapshot
  const differsFromPublished = JSON.stringify(preview) !== JSON.stringify(published)
  useUnsavedChangesGuard(isSuperadmin && hasLocalChanges)

  function clearMessages() { setFeedback(''); setError('') }

  function updateField<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    clearMessages()
  }

  function updateNavigation(index: number, patch: Partial<SiteNavigationItem>) {
    updateField('navigation', values.navigation.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function updateNavigationChild(parentIndex: number, childIndex: number, patch: Partial<SiteNavigationLink>) {
    const parent = values.navigation[parentIndex]
    updateNavigation(parentIndex, { children: parent.children.map((child, index) => index === childIndex ? { ...child, ...patch } : child) })
  }

  function addNavigationItem() {
    updateField('navigation', [...values.navigation, { id: makeId('menu'), label: 'Menu baru', href: '/', visible: true, children: [] }])
  }

  function addNavigationChild(parentIndex: number) {
    const parent = values.navigation[parentIndex]
    updateNavigation(parentIndex, { children: [...parent.children, { id: makeId('submenu'), label: 'Tautan baru', href: '/', visible: true }] })
  }

  function updateFooterColumn(index: number, patch: Partial<SiteFooterColumn>) {
    updateField('footerColumns', values.footerColumns.map((column, columnIndex) => columnIndex === index ? { ...column, ...patch } : column))
  }

  function updateFooterLink(columnIndex: number, linkIndex: number, patch: Partial<SiteFooterLink>) {
    const column = values.footerColumns[columnIndex]
    updateFooterColumn(columnIndex, { links: column.links.map((link, index) => index === linkIndex ? { ...link, ...patch } : link) })
  }

  function addFooterColumn() {
    updateField('footerColumns', [...values.footerColumns, { id: makeId('footer'), title: 'Kolom baru', visible: true, links: [] }])
  }

  function addFooterLink(columnIndex: number) {
    const column = values.footerColumns[columnIndex]
    updateFooterColumn(columnIndex, { links: [...column.links, {
      id: makeId('footer-link'), label: 'Tautan baru', href: '/', visible: true, channel: '', newTab: false,
    }] })
  }

  async function saveDraft() {
    setBusyAction('save'); clearMessages()
    const settings = toSettings(values)
    try {
      await writeContentDocumentAtId<SiteSettingsDraftDocument>(
        'siteSettingsDrafts', SITE_SETTINGS_ID,
        { ...settings, publicationState: 'draft', updatedBy: session.email }, draftExists,
      )
      setValues(toFormValues(settings)); setLoadedSnapshot(JSON.stringify(settings))
      setDraftExists(true); setPublicationState('draft')
      setFeedback('Draft tersimpan. Website publik belum berubah.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan draft.')
    } finally { setBusyAction(null) }
  }

  async function publish() {
    setValidationAttempted(true)
    clearMessages()
    if (!validation.success) {
      setActiveTab(validation.issues[0].tab)
      setError(`Publikasi ditahan. Perbaiki ${validation.issues.length} field yang belum valid.`)
      return
    }

    setBusyAction('publish')
    const settings = toSettings(values)
    try {
      await publishSiteSettingsDraft(settings, session.email)
      await requestRevalidation('settings')
      setValues(toFormValues(settings)); setPublished(settings); setLoadedSnapshot(JSON.stringify(settings))
      setDraftExists(true); setPublicationState('published'); setLastPublishedAt(Timestamp.now())
      setValidationAttempted(false)
      setFeedback('Versi baru diterbitkan dan website publik sedang disegarkan.')
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Gagal menerbitkan pengaturan.')
    } finally { setBusyAction(null) }
  }

  const statusLabel = hasLocalChanges
    ? 'Perubahan lokal belum disimpan'
    : differsFromPublished || publicationState === 'draft'
      ? 'Draft tersimpan, belum terbit'
      : 'Sinkron dengan website publik'

  return (
    <AdminShell activeHref="/admin/settings" description="Ruang kendali identitas, navigasi, footer, kanal resmi, dan metadata seluruh website." kicker="Global CMS" title="Pengaturan situs">
      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md agar pengaturan dapat dimuat." kicker="Konfigurasi" title="Firebase belum siap." />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil versi terbit dan draft..." />
      ) : (
        <div className="admin-settings-workspace">
          {!isSuperadmin ? <p className="admin-form-error" role="status">Hanya superadmin yang boleh mengubah pengaturan situs. Isian dikunci.</p> : null}
          <section className="admin-settings-status" aria-label="Status publikasi">
            <div><span className={`admin-settings-status-dot ${differsFromPublished || hasLocalChanges ? 'is-draft' : 'is-live'}`} /><div><small>Status dokumen</small><strong>{statusLabel}</strong></div></div>
            <dl><div><dt>Terakhir terbit</dt><dd>{formatTimestamp(lastPublishedAt)}</dd></div><div><dt>Editor</dt><dd>{session.email}</dd></div></dl>
          </section>

          <div className="admin-settings-layout">
            <aside className="admin-settings-tabs" role="tablist" aria-label="Bagian pengaturan global">
              {editorTabs.map((tab) => <button key={tab.id} data-invalid={validationAttempted && validation.issues.some((issue) => issue.tab === tab.id)} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}><span>{tab.number}</span>{tab.label}</button>)}
            </aside>

            <form className="admin-settings-editor" onSubmit={(event) => event.preventDefault()}>
              {activeTab === 'identity' ? <IdentityEditor values={values} preview={preview} disabled={!isSuperadmin} updateField={updateField} /> : null}
              {activeTab === 'channels' ? <ChannelsEditor values={values} preview={preview} disabled={!isSuperadmin} updateField={updateField} /> : null}
              {activeTab === 'header' ? <HeaderEditor values={values} disabled={!isSuperadmin} updateField={updateField} updateNavigation={updateNavigation} updateNavigationChild={updateNavigationChild} addNavigationItem={addNavigationItem} addNavigationChild={addNavigationChild} /> : null}
              {activeTab === 'footer' ? <FooterEditor values={values} disabled={!isSuperadmin} updateField={updateField} updateFooterColumn={updateFooterColumn} updateFooterLink={updateFooterLink} addFooterColumn={addFooterColumn} addFooterLink={addFooterLink} /> : null}
              {activeTab === 'seo' ? <SeoEditor values={values} preview={preview} disabled={!isSuperadmin} updateField={updateField} /> : null}

              {validationAttempted && !validation.success ? <div className="admin-validation-summary" role="alert"><strong>Pengaturan belum siap diterbitkan.</strong><ul>{validation.issues.map((issue, index) => <li key={`${issue.tab}-${index}`}><button type="button" onClick={() => setActiveTab(issue.tab)}>{issue.message}</button></li>)}</ul></div> : null}
              {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
              {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}
              <footer className="admin-settings-actions">
                <div><strong>{hasLocalChanges ? 'Ada perubahan lokal' : differsFromPublished ? 'Draft siap diterbitkan' : 'Tidak ada perubahan'}</strong><span>Publikasi selalu tercatat di riwayat dan dapat dipulihkan.</span></div>
                <button className="admin-secondary-button" type="button" disabled={!isSuperadmin || busyAction !== null || !hasLocalChanges} onClick={() => void saveDraft()}>{busyAction === 'save' ? 'Menyimpan...' : 'Simpan draft'}</button>
                <button className="admin-primary-button" type="button" disabled={!isSuperadmin || busyAction !== null || (!differsFromPublished && !hasLocalChanges)} onClick={() => void publish()}>{busyAction === 'publish' ? 'Menerbitkan...' : 'Terbitkan ke website'}</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

type EditorProps = {
  values: FormValues
  disabled: boolean
  updateField: <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => void
}

function SectionHeader({ number, label, title, body }: { number: string; label: string; title: string; body: string }) {
  return <header><span>{number} / {label}</span><h2>{title}</h2><p>{body}</p></header>
}

function IdentityEditor({ values, preview, disabled, updateField }: EditorProps & { preview: SiteSettings }) {
  return <section className="admin-settings-section">
    <SectionHeader number="01" label="Identitas" title="Siapa yang berbicara di website ini?" body="Nilai ini dipakai lintas halaman, bukan hanya di footer." />
    <div className="admin-settings-grid two-column">
      <label><span>Nama singkat situs</span><input disabled={disabled} value={values.siteName} onChange={(e) => updateField('siteName', e.target.value)} /></label>
      <label><span>Nama organisasi</span><input disabled={disabled} value={values.organizationName} onChange={(e) => updateField('organizationName', e.target.value)} /></label>
      <label><span>Program studi</span><input disabled={disabled} value={values.programName} onChange={(e) => updateField('programName', e.target.value)} /></label>
      <label><span>Fakultas / sekolah</span><input disabled={disabled} value={values.facultyName} onChange={(e) => updateField('facultyName', e.target.value)} /></label>
      <label><span>Universitas</span><input disabled={disabled} value={values.universityName} onChange={(e) => updateField('universityName', e.target.value)} /></label>
      <label><span>Nama kabinet</span><input disabled={disabled} value={values.cabinetName} onChange={(e) => updateField('cabinetName', e.target.value)} /></label>
      <label><span>Periode</span><input disabled={disabled} value={values.periodLabel} onChange={(e) => updateField('periodLabel', e.target.value)} /></label>
      <label><span>Tahun agenda</span><input inputMode="numeric" disabled={disabled} value={values.agendaYear} onChange={(e) => updateField('agendaYear', e.target.value)} /></label>
    </div>
    <label className="admin-settings-wide-field"><span>Tagline</span><textarea rows={3} disabled={disabled} value={values.tagline} onChange={(e) => updateField('tagline', e.target.value)} /></label>
    <label className="admin-settings-wide-field"><span>Konteks alamat / lembaga</span><input disabled={disabled} value={values.address} onChange={(e) => updateField('address', e.target.value)} /></label>
    <label className="admin-settings-wide-field"><span>Semboyan penutup</span><input disabled={disabled} value={values.closingCheer} onChange={(e) => updateField('closingCheer', e.target.value)} /></label>
    <div className="admin-settings-preview"><small>Pratinjau footer</small><strong>{formatCabinetTitle(preview)} · {formatPeriodTitle(preview)}</strong><p>{preview.organizationName} — {preview.address}</p></div>
  </section>
}

function ChannelsEditor({ values, preview, disabled, updateField }: EditorProps & { preview: SiteSettings }) {
  return <section className="admin-settings-section">
    <SectionHeader number="02" label="Kanal resmi" title="Satu sumber untuk semua tautan resmi." body="Footer dan halaman kontak mengikuti nilai ini setelah diterbitkan." />
    <div className="admin-settings-grid two-column">
      <label><span>Instagram</span><input disabled={disabled} value={values.instagram} onChange={(e) => updateField('instagram', normalizeInstagramHandle(e.target.value))} /><small>{instagramLabel(preview)}</small></label>
      <label><span>Email</span><input type="email" disabled={disabled} value={values.email} onChange={(e) => updateField('email', e.target.value)} /></label>
      <label><span>Website</span><input type="url" disabled={disabled} value={values.website} onChange={(e) => updateField('website', e.target.value)} /></label>
      <label><span>LinkedIn</span><input type="url" disabled={disabled} value={values.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." /></label>
      <label><span>X / Twitter</span><input type="url" disabled={disabled} value={values.x} onChange={(e) => updateField('x', e.target.value)} placeholder="https://x.com/..." /></label>
    </div>
  </section>
}

type HeaderEditorProps = EditorProps & {
  updateNavigation: (index: number, patch: Partial<SiteNavigationItem>) => void
  updateNavigationChild: (parentIndex: number, childIndex: number, patch: Partial<SiteNavigationLink>) => void
  addNavigationItem: () => void
  addNavigationChild: (parentIndex: number) => void
}

function HeaderEditor({ values, disabled, updateField, updateNavigation, updateNavigationChild, addNavigationItem, addNavigationChild }: HeaderEditorProps) {
  return <section className="admin-settings-section">
    <SectionHeader number="03" label="Header" title="Susun jalur utama pengunjung." body="Menu tersembunyi tetap tersimpan dalam draft, tetapi tidak tampil di website." />
    <div className="admin-settings-grid two-column compact">
      <label><span>Label tombol kanan</span><input disabled={disabled} maxLength={180} value={values.headerCtaLabel} onChange={(e) => updateField('headerCtaLabel', e.target.value)} /></label>
      <label><span>Tujuan tombol</span><input disabled={disabled} maxLength={2048} value={values.headerCtaHref} onChange={(e) => updateField('headerCtaHref', e.target.value)} /><small>Boleh berupa /path-internal, #anchor, mailto:, tel:, atau URL HTTP/HTTPS.</small></label>
    </div>
    <div className="admin-structure-list">
      {values.navigation.map((item, index) => <article className="admin-structure-card" key={item.id}>
        <div className="admin-structure-row">
          <span className="admin-structure-index">{String(index + 1).padStart(2, '0')}</span>
          <input aria-label="Label menu" disabled={disabled} value={item.label} onChange={(e) => updateNavigation(index, { label: e.target.value })} />
          <input aria-label="Tujuan menu" disabled={disabled || item.children.length > 0} value={item.href} onChange={(e) => updateNavigation(index, { href: e.target.value })} />
          <Visibility checked={item.visible} disabled={disabled} onChange={(visible) => updateNavigation(index, { visible })} />
          <RowActions disabled={disabled} index={index} length={values.navigation.length} onMove={(direction) => updateField('navigation', moveItem(values.navigation, index, direction))} onDelete={() => updateField('navigation', values.navigation.filter((_, itemIndex) => itemIndex !== index))} />
        </div>
        {item.children.map((child, childIndex) => <div className="admin-structure-row is-child" key={child.id}>
          <span className="admin-structure-branch">↳</span>
          <input aria-label="Label submenu" disabled={disabled} value={child.label} onChange={(e) => updateNavigationChild(index, childIndex, { label: e.target.value })} />
          <input aria-label="Tujuan submenu" disabled={disabled} value={child.href} onChange={(e) => updateNavigationChild(index, childIndex, { href: e.target.value })} />
          <Visibility checked={child.visible} disabled={disabled} onChange={(visible) => updateNavigationChild(index, childIndex, { visible })} />
          <RowActions disabled={disabled} index={childIndex} length={item.children.length} onMove={(direction) => updateNavigation(index, { children: moveItem(item.children, childIndex, direction) })} onDelete={() => updateNavigation(index, { children: item.children.filter((_, currentIndex) => currentIndex !== childIndex) })} />
        </div>)}
        <button className="admin-inline-add" type="button" disabled={disabled} onClick={() => addNavigationChild(index)}>+ Tambah submenu</button>
      </article>)}
    </div>
    <button className="admin-secondary-button" type="button" disabled={disabled} onClick={addNavigationItem}>+ Tambah menu utama</button>
  </section>
}

type FooterEditorProps = EditorProps & {
  updateFooterColumn: (index: number, patch: Partial<SiteFooterColumn>) => void
  updateFooterLink: (columnIndex: number, linkIndex: number, patch: Partial<SiteFooterLink>) => void
  addFooterColumn: () => void
  addFooterLink: (columnIndex: number) => void
}

function FooterEditor({ values, disabled, updateField, updateFooterColumn, updateFooterLink, addFooterColumn, addFooterLink }: FooterEditorProps) {
  return <section className="admin-settings-section">
    <SectionHeader number="04" label="Footer" title="Informasi penutup di setiap halaman." body="Tautan dapat memakai URL sendiri atau mengikuti kanal resmi." />
    <div className="admin-settings-grid two-column compact">
      <label><span>Catatan masthead</span><input disabled={disabled} value={values.footerMastheadNote} onChange={(e) => updateField('footerMastheadNote', e.target.value)} /></label>
      <label><span>Subcatatan masthead</span><input disabled={disabled} value={values.footerMastheadSubnote} onChange={(e) => updateField('footerMastheadSubnote', e.target.value)} /></label>
    </div>
    <div className="admin-structure-list">
      {values.footerColumns.map((column, columnIndex) => <article className="admin-structure-card" key={column.id}>
        <div className="admin-structure-row footer-column-row">
          <span className="admin-structure-index">{String(columnIndex + 1).padStart(2, '0')}</span>
          <input aria-label="Judul kolom footer" disabled={disabled} value={column.title} onChange={(e) => updateFooterColumn(columnIndex, { title: e.target.value })} />
          <Visibility checked={column.visible} disabled={disabled} onChange={(visible) => updateFooterColumn(columnIndex, { visible })} />
          <RowActions disabled={disabled} index={columnIndex} length={values.footerColumns.length} onMove={(direction) => updateField('footerColumns', moveItem(values.footerColumns, columnIndex, direction))} onDelete={() => updateField('footerColumns', values.footerColumns.filter((_, index) => index !== columnIndex))} />
        </div>
        {column.links.map((link, linkIndex) => <div className="admin-footer-link-row" key={link.id}>
          <span className="admin-structure-branch">↳</span>
          <input aria-label="Label tautan footer" disabled={disabled} value={link.label} onChange={(e) => updateFooterLink(columnIndex, linkIndex, { label: e.target.value })} />
          <select aria-label="Sumber tautan footer" disabled={disabled} value={link.channel} onChange={(e) => updateFooterLink(columnIndex, linkIndex, { channel: e.target.value as SiteFooterLink['channel'] })}><option value="">URL sendiri</option>{siteChannelKeys.map((channel) => <option value={channel} key={channel}>{channel}</option>)}</select>
          <input aria-label="URL tautan footer" disabled={disabled || Boolean(link.channel)} value={link.href} onChange={(e) => updateFooterLink(columnIndex, linkIndex, { href: e.target.value })} placeholder={link.channel ? 'Mengikuti kanal resmi' : '/tujuan'} />
          <Visibility checked={link.visible} disabled={disabled} onChange={(visible) => updateFooterLink(columnIndex, linkIndex, { visible })} />
          <label className="admin-visibility-toggle"><input type="checkbox" disabled={disabled} checked={link.newTab} onChange={(e) => updateFooterLink(columnIndex, linkIndex, { newTab: e.target.checked })} /><span>Tab baru</span></label>
          <button className="admin-text-danger" type="button" disabled={disabled} onClick={() => updateFooterColumn(columnIndex, { links: column.links.filter((_, index) => index !== linkIndex) })}>Hapus</button>
        </div>)}
        <button className="admin-inline-add" type="button" disabled={disabled} onClick={() => addFooterLink(columnIndex)}>+ Tambah tautan</button>
      </article>)}
    </div>
    <button className="admin-secondary-button" type="button" disabled={disabled} onClick={addFooterColumn}>+ Tambah kolom footer</button>
  </section>
}

function SeoEditor({ values, preview, disabled, updateField }: EditorProps & { preview: SiteSettings }) {
  return <section className="admin-settings-section">
    <SectionHeader number="05" label="SEO" title="Identitas website di mesin pencari." body="Metadata ini menjadi bawaan global untuk halaman tanpa metadata khusus." />
    <div className="admin-settings-grid two-column">
      <label><span>URL utama</span><input type="url" disabled={disabled} value={values.siteUrl} onChange={(e) => updateField('siteUrl', e.target.value)} /></label>
      <label><span>Locale Open Graph</span><input disabled={disabled} value={values.locale} onChange={(e) => updateField('locale', e.target.value)} /></label>
    </div>
    <label className="admin-settings-wide-field"><span>Judul situs</span><input disabled={disabled} maxLength={65} value={values.siteTitle} onChange={(e) => updateField('siteTitle', e.target.value)} /><small>{values.siteTitle.length}/65 karakter</small></label>
    <label className="admin-settings-wide-field"><span>Deskripsi situs</span><textarea rows={4} disabled={disabled} maxLength={170} value={values.siteDescription} onChange={(e) => updateField('siteDescription', e.target.value)} /><small>{values.siteDescription.length}/170 karakter</small></label>
    <div className="admin-serp-preview"><small>Pratinjau hasil pencarian</small><strong>{preview.siteTitle}</strong><span>{preview.siteUrl}</span><p>{preview.siteDescription}</p></div>
  </section>
}

function Visibility({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label className="admin-visibility-toggle"><input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>Tampil</span></label>
}

function RowActions({ disabled, index, length, onMove, onDelete }: { disabled: boolean; index: number; length: number; onMove: (direction: -1 | 1) => void; onDelete: () => void }) {
  return <div className="admin-row-actions"><button type="button" aria-label="Naikkan" disabled={disabled || index === 0} onClick={() => onMove(-1)}>↑</button><button type="button" aria-label="Turunkan" disabled={disabled || index === length - 1} onClick={() => onMove(1)}>↓</button><button type="button" disabled={disabled} onClick={onDelete}>Hapus</button></div>
}
