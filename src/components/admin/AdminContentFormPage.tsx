'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { articleTabs } from '@/data/articles'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminRichTextEditor } from './AdminRichTextEditor'
import { AdminShell } from './AdminShell'
import {
  buildContentPayload,
  contentCrudConfigs,
  documentToContentFormValues,
  getEmptyContentFormValues,
  type ContentFormValues,
  type ContentKind,
  type ManagedContentDocument,
} from '@/lib/admin/content-crud'
import {
  validateAnnouncementInput,
  validateArticleInput,
  validateEventInput,
} from '@/lib/admin/content-form-validation'
import { validateGalleryImageUrl } from '@/lib/admin/media-validation'
import {
  createContentDocument,
  getContentDocument,
  isArticleSlugAvailable,
  updateContentDocument,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { slugify } from '@/lib/slug'
import type { ContentStatus } from '@/types/content'

type AdminContentFormPageProps = {
  documentId?: string
  kind: ContentKind
}

function validateContentForm(kind: ContentKind, values: ContentFormValues) {
  if (kind === 'announcements') return validateAnnouncementInput(values)
  if (kind === 'events') return validateEventInput(values)
  return validateArticleInput(values)
}

const publicationNotes: Record<ContentStatus, string> = {
  archived: 'Disimpan sebagai arsip dan tidak tampil di halaman publik.',
  draft: 'Hanya terlihat di panel admin sampai diterbitkan.',
  published: 'Langsung tampil pada kanal publik setelah disimpan.',
}

export function AdminContentFormPage({ documentId, kind }: AdminContentFormPageProps) {
  const router = useRouter()
  const config = contentCrudConfigs[kind]
  const mode = documentId ? 'edit' : 'create'
  const [values, setValues] = useState<ContentFormValues>(() => getEmptyContentFormValues(kind))
  const [errors, setErrors] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(documentId && hasFirebaseConfig()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const pageTitle = useMemo(
    () => `${mode === 'create' ? 'Tambah' : 'Edit'} ${config.label.toLowerCase()}`,
    [config.label, mode],
  )
  const isCoverPreviewable = !values.coverImage.trim() || validateGalleryImageUrl(values.coverImage.trim()).success

  useEffect(() => {
    if (!documentId || !hasFirebaseConfig()) return

    let isMounted = true
    const currentDocumentId = documentId

    async function loadDocument() {
      setIsLoading(true)
      setLoadError('')

      try {
        const document = await getContentDocument<ManagedContentDocument>(config.collectionName, currentDocumentId)

        if (!isMounted) return

        if (!document) {
          setLoadError('Konten tidak ditemukan.')
          return
        }

        setValues(documentToContentFormValues(kind, document))
        setIsDirty(false)
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Gagal memuat konten.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadDocument()
    return () => { isMounted = false }
  }, [config.collectionName, documentId, kind])

  useEffect(() => {
    if (!isDirty) return

    function preventAccidentalClose(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', preventAccidentalClose)
    return () => window.removeEventListener('beforeunload', preventAccidentalClose)
  }, [isDirty])

  function updateField<Field extends keyof ContentFormValues>(field: Field, value: ContentFormValues[Field]) {
    setIsDirty(true)
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
      slug:
        field === 'title' && kind === 'articles' && mode === 'create' && !currentValues.slug
          ? slugify(String(value))
          : currentValues.slug,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const intent = submitter?.value
    const nextValues: ContentFormValues = {
      ...values,
      status: intent === 'publish' ? 'published' : values.status,
      slug: kind === 'articles' ? slugify(values.slug || values.title) : values.slug,
    }
    const validation = validateContentForm(kind, nextValues)
    setErrors(validation.errors)
    setFeedback('')

    if (!validation.success || !hasFirebaseConfig()) return

    setIsSubmitting(true)

    try {
      if (kind === 'articles') {
        const slugIsAvailable = await isArticleSlugAvailable(nextValues.slug, documentId)

        if (!slugIsAvailable) {
          setErrors(['Slug sudah digunakan artikel lain. Ubah slug sebelum menyimpan.'])
          return
        }
      }

      const payload = buildContentPayload(kind, nextValues)

      if (mode === 'create') {
        await createContentDocument(config.collectionName, payload)
        setIsDirty(false)
        router.push(config.basePath)
        return
      }

      if (documentId) {
        await updateContentDocument(config.collectionName, documentId, payload)
        setValues(nextValues)
        setIsDirty(false)
        setFeedback(nextValues.status === 'published' ? 'Konten tersimpan dan sudah tampil publik.' : 'Konten berhasil disimpan.')
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Gagal menyimpan konten.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminShell activeHref={config.basePath} description={config.description} kicker={config.kicker} title={pageTitle}>
      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md sebelum membuat atau mengedit konten." kicker="Konfigurasi" title="Firebase belum siap." />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data konten..." />
      ) : loadError ? (
        <AdminEmptyState body={loadError} kicker="Error" title="Konten tidak bisa dimuat." />
      ) : (
        <form className="admin-editor-form" onSubmit={handleSubmit}>
          <div className="admin-editor-layout">
            <div className="admin-editor-canvas">
              <section className="admin-form-section">
                <div className="admin-form-section-heading"><span>01</span><div><h2>Informasi utama</h2><p>Judul dan ringkasan akan menjadi hal pertama yang dilihat pembaca.</p></div></div>
                <div className="admin-field admin-title-field">
                  <label htmlFor="content-title">Judul</label>
                  <input id="content-title" value={values.title} onChange={(event) => updateField('title', event.target.value)} maxLength={180} placeholder={`Judul ${config.label.toLowerCase()}`} />
                  <small>{values.title.length}/180 karakter</small>
                </div>

                {kind === 'articles' ? (
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label htmlFor="content-slug">Slug URL</label>
                      <div className="admin-input-prefix"><span>/berita/</span><input id="content-slug" value={values.slug} onChange={(event) => updateField('slug', slugify(event.target.value))} /></div>
                    </div>
                    <div className="admin-field">
                      <label htmlFor="content-category">Kategori</label>
                      <select id="content-category" value={values.category} onChange={(event) => updateField('category', event.target.value as ContentFormValues['category'])}>
                        {articleTabs.map((tab) => <option value={tab.key} key={tab.key}>{tab.label}</option>)}
                      </select>
                    </div>
                  </div>
                ) : null}

                <div className="admin-field">
                  <label htmlFor="content-excerpt">Ringkasan</label>
                  <textarea id="content-excerpt" value={values.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} rows={4} maxLength={320} placeholder="Ringkas isi konten dalam satu atau dua kalimat." />
                  <small>{values.excerpt.length}/320 karakter</small>
                </div>
              </section>

              {kind === 'announcements' ? (
                <section className="admin-form-section"><div className="admin-form-section-heading"><span>02</span><div><h2>Isi pengumuman</h2><p>Tulis informasi utama secara singkat dan jelas.</p></div></div><div className="admin-field"><label htmlFor="content-body">Isi pengumuman</label><textarea id="content-body" value={values.body} onChange={(event) => updateField('body', event.target.value)} rows={10} /></div></section>
              ) : null}

              {kind === 'events' || kind === 'announcements' ? (
                <section className="admin-form-section"><div className="admin-form-section-heading"><span>02</span><div><h2>Detail pelaksanaan</h2><p>Lengkapi waktu dan lokasi yang dibutuhkan audiens.</p></div></div><div className="admin-form-grid"><div className="admin-field"><label htmlFor="content-date">Tanggal</label><input id="content-date" type="date" value={values.date} onChange={(event) => updateField('date', event.target.value)} /></div>{kind === 'events' ? <div className="admin-field"><label htmlFor="content-location">Lokasi</label><input id="content-location" value={values.location} onChange={(event) => updateField('location', event.target.value)} /></div> : null}</div></section>
              ) : null}

              {kind === 'articles' ? (
                <section className="admin-form-section admin-article-section">
                  <div className="admin-form-section-heading"><span>02</span><div><h2>Isi artikel</h2><p>Susun tulisan menggunakan heading, daftar, kutipan, tautan, dan gambar.</p></div></div>
                  <AdminRichTextEditor value={values.content} onChange={(content) => updateField('content', content)} />
                </section>
              ) : null}

              {kind === 'events' || kind === 'articles' ? (
                <section className="admin-form-section">
                  <div className="admin-form-section-heading"><span>03</span><div><h2>Media utama</h2><p>Gunakan gambar landscape dari ImageKit untuk menjaga performa website.</p></div></div>
                  <div className="admin-field"><label htmlFor="content-cover">URL cover ImageKit</label><input id="content-cover" type="url" value={values.coverImage} onChange={(event) => updateField('coverImage', event.target.value)} placeholder="https://ik.imagekit.io/..." /></div>
                  {kind === 'articles' && values.coverImage && isCoverPreviewable ? <div className="admin-cover-preview"><Image src={values.coverImage} alt="Preview cover artikel" fill sizes="(max-width: 900px) 100vw, 720px" /></div> : null}
                </section>
              ) : null}
            </div>

            <aside className="admin-publish-panel">
              <div className="admin-publish-card">
                <span className="admin-publish-label">Publikasi</span>
                <div className="admin-field"><label htmlFor="content-status">Status</label><select id="content-status" value={values.status} onChange={(event) => updateField('status', event.target.value as ContentStatus)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                <p>{publicationNotes[values.status]}</p>
                {kind === 'articles' && values.slug ? <div className="admin-public-url"><span>URL publik</span><code>/berita/{values.slug}</code></div> : null}
                {kind === 'articles' && documentId && values.status === 'published' ? <Link className="admin-preview-link" href={`/berita/${values.slug}`} target="_blank" rel="noopener noreferrer">Lihat halaman publik ↗</Link> : null}
              </div>

              <div className="admin-editor-tips"><span>Checklist redaksi</span><ul><li>Judul jelas dan tidak terlalu panjang</li><li>Ringkasan menjelaskan inti berita</li><li>Cover punya izin publikasi</li><li>Nama, tanggal, dan tautan sudah benar</li></ul></div>
            </aside>
          </div>

          {errors.length > 0 ? <div className="admin-form-error" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
          {feedback ? <p className="admin-form-success" role="status">{feedback}</p> : null}

          <footer className="admin-editor-actions">
            <div><span>{isDirty ? 'Perubahan belum disimpan' : 'Semua perubahan tersimpan'}</span><Link href={config.basePath}>Batal dan kembali</Link></div>
            <div>
              <button className="admin-secondary-button" type="submit" name="intent" value="save" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : values.status === 'draft' ? 'Simpan draft' : 'Simpan perubahan'}</button>
              {kind === 'articles' && values.status !== 'published' ? <button className="admin-primary-button" type="submit" name="intent" value="publish" disabled={isSubmitting}>Terbitkan berita</button> : null}
            </div>
          </footer>
        </form>
      )}
    </AdminShell>
  )
}
