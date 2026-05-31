'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { articleTabs } from '@/data/articles'
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
import { createContentDocument, getContentDocument, updateContentDocument } from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { slugify } from '@/lib/slug'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminShell } from './AdminShell'

type AdminContentFormPageProps = {
  documentId?: string
  kind: ContentKind
}

function validateContentForm(kind: ContentKind, values: ContentFormValues) {
  if (kind === 'announcements') {
    return validateAnnouncementInput(values)
  }

  if (kind === 'events') {
    return validateEventInput(values)
  }

  return validateArticleInput(values)
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

  const pageTitle = useMemo(
    () => `${mode === 'create' ? 'Tambah' : 'Edit'} ${config.label.toLowerCase()}`,
    [config.label, mode],
  )

  useEffect(() => {
    if (!documentId || !hasFirebaseConfig()) {
      return
    }

    let isMounted = true
    const currentDocumentId = documentId

    async function loadDocument() {
      setIsLoading(true)
      setLoadError('')

      try {
        const document = await getContentDocument<ManagedContentDocument>(config.collectionName, currentDocumentId)

        if (!isMounted) {
          return
        }

        if (!document) {
          setLoadError('Konten tidak ditemukan.')
          return
        }

        setValues(documentToContentFormValues(kind, document))
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Gagal memuat konten.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDocument()

    return () => {
      isMounted = false
    }
  }, [config.collectionName, documentId, kind])

  function updateField<Field extends keyof ContentFormValues>(field: Field, value: ContentFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
      slug:
        field === 'title' && kind === 'articles' && mode === 'create' && !currentValues.slug
          ? slugify(value)
          : currentValues.slug,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateContentForm(kind, values)
    setErrors(validation.errors)
    setFeedback('')

    if (!validation.success || !hasFirebaseConfig()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildContentPayload(kind, values)

      if (mode === 'create') {
        await createContentDocument(config.collectionName, payload)
        router.push(config.basePath)
        return
      }

      if (documentId) {
        await updateContentDocument(config.collectionName, documentId, payload)
        setFeedback('Konten berhasil diperbarui.')
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
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md sebelum membuat atau mengedit konten."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data konten..." />
      ) : loadError ? (
        <AdminEmptyState body={loadError} kicker="Error" title="Konten tidak bisa dimuat." />
      ) : (
        <form className="admin-content-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="content-title">Judul</label>
              <input
                id="content-title"
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="content-status">Status</label>
              <select
                id="content-status"
                value={values.status}
                onChange={(event) => updateField('status', event.target.value as ContentFormValues['status'])}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {kind === 'articles' ? (
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="content-slug">Slug</label>
                <input
                  id="content-slug"
                  value={values.slug}
                  onChange={(event) => updateField('slug', event.target.value)}
                />
              </div>
              <div className="admin-field">
                <label htmlFor="content-category">Kategori</label>
                <select
                  id="content-category"
                  value={values.category}
                  onChange={(event) => updateField('category', event.target.value as ContentFormValues['category'])}
                >
                  {articleTabs.map((tab) => (
                    <option value={tab.key} key={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="admin-field">
            <label htmlFor="content-excerpt">Ringkasan</label>
            <textarea
              id="content-excerpt"
              value={values.excerpt}
              onChange={(event) => updateField('excerpt', event.target.value)}
              rows={3}
            />
          </div>

          {kind === 'announcements' ? (
            <div className="admin-field">
              <label htmlFor="content-body">Isi pengumuman</label>
              <textarea
                id="content-body"
                value={values.body}
                onChange={(event) => updateField('body', event.target.value)}
                rows={6}
              />
            </div>
          ) : null}

          {kind === 'events' || kind === 'announcements' ? (
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="content-date">Tanggal</label>
                <input
                  id="content-date"
                  type="date"
                  value={values.date}
                  onChange={(event) => updateField('date', event.target.value)}
                />
              </div>
              {kind === 'events' ? (
                <div className="admin-field">
                  <label htmlFor="content-location">Lokasi</label>
                  <input
                    id="content-location"
                    value={values.location}
                    onChange={(event) => updateField('location', event.target.value)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {kind === 'events' || kind === 'articles' ? (
            <div className="admin-field">
              <label htmlFor="content-cover">Cover image URL</label>
              <input
                id="content-cover"
                value={values.coverImage}
                onChange={(event) => updateField('coverImage', event.target.value)}
              />
            </div>
          ) : null}

          {kind === 'articles' ? (
            <div className="admin-field">
              <label htmlFor="content-body">Isi artikel</label>
              <textarea
                id="content-body"
                value={values.content}
                onChange={(event) => updateField('content', event.target.value)}
                rows={10}
              />
            </div>
          ) : null}

          {errors.length > 0 ? (
            <div className="admin-form-error" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          {feedback ? <p className="admin-form-success">{feedback}</p> : null}

          <div className="admin-form-actions">
            <button className="admin-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
            <Link className="admin-secondary-link" href={config.basePath}>
              Batal
            </Link>
          </div>
        </form>
      )}
    </AdminShell>
  )
}
