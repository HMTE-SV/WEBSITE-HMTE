'use client'

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { articleTabs } from '@/data/articles'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminDataResourcesEditor } from './AdminDataResourcesEditor'
import { AdminImageField } from './AdminImageField'
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
  validatePublicDataInput,
} from '@/lib/admin/content-form-validation'
import { publicDataCategories } from '@/lib/public-data'
import { validateGalleryImageUrl } from '@/lib/admin/media-validation'
import {
  createContentDocument,
  getContentDocument,
  isContentSlugAvailable,
  listContentDocuments,
  updateContentDocument,
} from '@/lib/firebase/content-services'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { useUnsavedChangesGuard } from '@/lib/admin/use-unsaved-changes-guard'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { normalizeSlugInput, slugify } from '@/lib/slug'
import type { ContentStatus } from '@/types/content'
import type { ProgramDocument } from '@/types/firestore'

const AdminBlockEditor = dynamic(() => import('./AdminBlockEditor'), {
  loading: () => <div className="adm-skeleton adp-block-editor-loading" aria-label="Memuat editor" />,
  ssr: false,
})

type AdminContentFormPageProps = {
  documentId?: string
  kind: ContentKind
}

function validateContentForm(kind: ContentKind, values: ContentFormValues) {
  if (kind === 'announcements') return validateAnnouncementInput(values)
  if (kind === 'articles') return validateArticleInput(values)
  return validatePublicDataInput(values)
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
  const [programNames, setProgramNames] = useState<string[]>([])

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
    if (kind !== 'articles' || !hasFirebaseConfig()) return

    let isMounted = true

    void listContentDocuments<ProgramDocument>('programs')
      .then((programs) => {
        if (!isMounted) return
        setProgramNames(programs
          .filter((program) => program.active && program.name.trim())
          .sort((first, second) => first.order - second.order)
          .map((program) => program.name.trim()))
      })
      .catch(() => {
        if (isMounted) setProgramNames([])
      })

    return () => { isMounted = false }
  }, [kind])

  useUnsavedChangesGuard(isDirty)

  function updateField<Field extends keyof ContentFormValues>(field: Field, value: ContentFormValues[Field]) {
    setIsDirty(true)
    setValues((currentValues) => {
      const shouldDeriveSlug =
        field === 'title' && kind !== 'announcements' && mode === 'create' && !currentValues.slug

      return {
        ...currentValues,
        ...(shouldDeriveSlug ? { slug: slugify(String(value)) } : null),
        [field]: value,
      }
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const intent = submitter?.value
    const nextValues: ContentFormValues = {
      ...values,
      status: intent === 'publish' ? 'published' : values.status,
      slug: kind !== 'announcements' ? slugify(values.slug || values.title) : values.slug,
    }
    const validation = validateContentForm(kind, nextValues)
    setErrors(validation.errors)
    setFeedback('')

    if (!validation.success || !hasFirebaseConfig()) return

    setIsSubmitting(true)

    try {
      if (kind !== 'announcements') {
        const slugCollection = kind === 'articles' ? 'articles' : 'publicData'
        const slugIsAvailable = await isContentSlugAvailable(slugCollection, nextValues.slug, documentId)

        if (!slugIsAvailable) {
          setErrors(['Slug sudah digunakan konten lain pada kanal ini. Ubah slug sebelum menyimpan.'])
          return
        }
      }

      const payload = buildContentPayload(kind, nextValues)

      if (mode === 'create') {
        await createContentDocument(config.collectionName, payload)
        setIsDirty(false)

        await requestRevalidation(kind)

        router.push(config.basePath)
        return
      }

      if (documentId) {
        await updateContentDocument(config.collectionName, documentId, payload)
        setValues(nextValues)
        setIsDirty(false)

        await requestRevalidation(kind)
        setFeedback(nextValues.status === 'published' ? 'Konten tersimpan dan sudah tampil publik.' : 'Konten berhasil disimpan.')
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Gagal menyimpan konten.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminShell activeHref={config.basePath} title={pageTitle}>
      {!hasFirebaseConfig() ? (
        <AdminEmptyState body="Isi .env.local sesuai FIREBASE_SETUP.md sebelum membuat atau mengedit konten." title="Firebase belum siap." />
      ) : isLoading ? (
        <div className="adp-skeleton-list" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => <div className="adm-skeleton adp-skeleton-row" key={index} />)}
        </div>
      ) : loadError ? (
        <AdminEmptyState body={loadError} title="Konten tidak bisa dimuat." />
      ) : (
        <form className="adp-editor-form" onSubmit={handleSubmit}>
          <div className="adp-editor-layout">
            <div className="adp-editor-canvas">
              <section className="adm-panel adp-form-section">
                <div className="adm-panel-head"><h2>Informasi utama</h2><p>Judul dan ringkasan akan menjadi hal pertama yang dilihat pembaca.</p></div>
                <div className="adp-form-section-body">
                  <div className="adm-field">
                    <label htmlFor="content-title">Judul</label>
                    <input id="content-title" value={values.title} onChange={(event) => updateField('title', event.target.value)} maxLength={180} placeholder={`Judul ${config.label.toLowerCase()}`} />
                    <small>{values.title.length}/180 karakter</small>
                  </div>

                  {kind === 'articles' ? (
                    <>
                      <div className="adp-field-grid">
                        <div className="adm-field">
                          <label htmlFor="content-slug">Slug URL</label>
                          <div className="adp-input-prefix"><span>/berita/</span><input id="content-slug" value={values.slug} onChange={(event) => updateField('slug', normalizeSlugInput(event.target.value))} onBlur={(event) => updateField('slug', slugify(event.target.value))} maxLength={120} placeholder="judul-berita-kamu" /></div>
                          <small>Huruf kecil, angka, dan tanda hubung. Spasi otomatis jadi tanda hubung.</small>
                        </div>
                        <div className="adm-field">
                          <label htmlFor="content-category">Kategori</label>
                          <select id="content-category" value={values.category} onChange={(event) => updateField('category', event.target.value as ContentFormValues['category'])}>
                            {articleTabs.map((tab) => <option value={tab.key} key={tab.key}>{tab.label}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="adp-field-grid">
                        <div className="adm-field">
                          <label htmlFor="content-publisher">Dipublikasikan oleh</label>
                          <input id="content-publisher" value={values.publisher} onChange={(event) => updateField('publisher', event.target.value)} maxLength={120} placeholder="HMTE TRE SV UGM" />
                          <small>Nama redaksi, bidang, atau pihak yang bertanggung jawab atas publikasi.</small>
                        </div>
                        <div className="adm-field">
                          <label htmlFor="content-related-program">Program terkait</label>
                          <select id="content-related-program" value={values.relatedProgram} onChange={(event) => updateField('relatedProgram', event.target.value)}>
                            <option value="">Tidak terkait program tertentu</option>
                            {values.relatedProgram && !programNames.includes(values.relatedProgram) ? <option value={values.relatedProgram}>{values.relatedProgram} (tersimpan)</option> : null}
                            {programNames.map((programName) => <option value={programName} key={programName}>{programName}</option>)}
                          </select>
                          <small>Opsional. Tampil sebagai tautan menuju halaman program di sisi artikel.</small>
                        </div>
                      </div>

                      <label className="adp-content-meta-toggle">
                        <input
                          type="checkbox"
                          checked={values.showArticleMeta}
                          onChange={(event) => updateField('showArticleMeta', event.target.checked)}
                        />
                        <span className="adp-content-meta-toggle-copy">
                          <strong>Tampilkan panel informasi</strong>
                          <small>Menampilkan penerbit, tanggal, kategori, dan program terkait di sisi artikel.</small>
                        </span>
                        <span className="adp-content-meta-switch" aria-hidden="true"><i /></span>
                      </label>
                    </>
                  ) : null}

                  {kind === 'publicData' ? (
                    <>
                      <div className="adp-field-grid">
                        <div className="adm-field">
                          <label htmlFor="content-slug">Slug URL</label>
                          <div className="adp-input-prefix"><span>/data/</span><input id="content-slug" value={values.slug} onChange={(event) => updateField('slug', normalizeSlugInput(event.target.value))} onBlur={(event) => updateField('slug', slugify(event.target.value))} maxLength={120} placeholder="data-mahasiswa-tre-25" /></div>
                          <small>Alamat permanen untuk halaman data ini.</small>
                        </div>
                        <div className="adm-field">
                          <label htmlFor="content-data-category">Kategori</label>
                          <select id="content-data-category" value={values.dataCategory} onChange={(event) => updateField('dataCategory', event.target.value as ContentFormValues['dataCategory'])}>
                            {publicDataCategories.map((category) => <option value={category.value} key={category.value}>{category.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="adm-field">
                        <label htmlFor="content-period">Periode / angkatan</label>
                        <input id="content-period" value={values.period} onChange={(event) => updateField('period', event.target.value)} maxLength={80} placeholder="Contoh: TRE 25 · Semester Gasal 2026/2027" />
                        <small>Boleh dikosongkan jika datanya tidak terikat periode tertentu.</small>
                      </div>
                      <label className="adp-content-meta-toggle">
                        <input
                          type="checkbox"
                          checked={values.showDataMeta}
                          onChange={(event) => updateField('showDataMeta', event.target.checked)}
                        />
                        <span className="adp-content-meta-toggle-copy">
                          <strong>Tampilkan panel informasi</strong>
                          <small>Menampilkan kategori, periode, pembaruan, akses, dan jumlah resource di sisi halaman.</small>
                        </span>
                        <span className="adp-content-meta-switch" aria-hidden="true"><i /></span>
                      </label>
                    </>
                  ) : null}

                  <div className="adm-field">
                    <label htmlFor="content-excerpt">Ringkasan</label>
                    <textarea id="content-excerpt" value={values.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} rows={4} maxLength={320} placeholder="Ringkas isi konten dalam satu atau dua kalimat." />
                    <small>{values.excerpt.length}/320 karakter</small>
                  </div>
                </div>
              </section>

              {kind === 'announcements' ? (
                <section className="adm-panel adp-form-section">
                  <div className="adm-panel-head"><h2>Isi pengumuman</h2><p>Susun seperti berita: gunakan heading, daftar, tabel, gambar, berkas, atau iframe.</p></div>
                  <div className="adp-form-section-body">
                    <AdminBlockEditor value={values.body} onChange={(body) => updateField('body', body)} />
                  </div>
                </section>
              ) : null}

              {kind === 'announcements' ? (
                <section className="adm-panel adp-form-section">
                  <div className="adm-panel-head"><h2>Tanggal berlaku</h2><p>Dipakai untuk mengurutkan pengumuman di halaman publik, bukan waktu kamu menekan terbit.</p></div>
                  <div className="adp-form-section-body">
                    <div className="adp-field-grid"><div className="adm-field"><label htmlFor="content-date">Tanggal</label><input id="content-date" type="date" value={values.date} onChange={(event) => updateField('date', event.target.value)} /></div></div>
                  </div>
                </section>
              ) : null}

              {kind === 'articles' || kind === 'publicData' ? (
                <section className="adm-panel adp-form-section">
                  <div className="adm-panel-head"><h2>{kind === 'publicData' ? 'Penjelasan data' : 'Isi artikel'}</h2><p>{kind === 'publicData' ? 'Jelaskan sumber, cara membaca, pembaruan, dan konteks data. Iframe spreadsheet dapat disisipkan dari menu /.' : 'Susun tulisan menggunakan heading, daftar, kutipan, tautan, dan gambar.'}</p></div>
                  <div className="adp-form-section-body">
                    <AdminBlockEditor value={values.content} onChange={(content) => updateField('content', content)} />
                  </div>
                </section>
              ) : null}

              {kind === 'publicData' ? (
                <section className="adm-panel adp-form-section">
                  <div className="adm-panel-head"><h2>Spreadsheet dan lampiran</h2><p>Hubungkan data hidup atau unggah snapshot berkas yang perlu diakses pembaca.</p></div>
                  <div className="adp-form-section-body">
                    <AdminDataResourcesEditor value={values.resources} onChange={(resources) => updateField('resources', resources)} />
                  </div>
                </section>
              ) : null}

              {kind === 'articles' ? (
                <section className="adm-panel adp-form-section">
                  <div className="adm-panel-head"><h2>Media utama</h2><p>Gunakan gambar landscape dari ImageKit untuk menjaga performa website.</p></div>
                  <div className="adp-form-section-body">
                    <AdminImageField
                      folder="berita"
                      hint="Gambar landscape, sisi terpanjang minimal 1200px. Maksimal 3MB, format JPG, PNG, atau WebP."
                      label="Cover"
                      onChange={(url) => updateField('coverImage', url)}
                      value={values.coverImage}
                    />
                    {values.coverImage && isCoverPreviewable ? <div className="adp-cover-preview"><Image src={values.coverImage} alt="Preview cover artikel" fill sizes="(max-width: 900px) 100vw, 720px" /></div> : null}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="adp-publish-panel">
              <div className="adm-panel adp-publish-card">
                <div className="adm-panel-head"><h2>Publikasi</h2></div>
                <div className="adp-form-section-body">
                  <div className="adm-field"><label htmlFor="content-status">Status</label><select id="content-status" value={values.status} onChange={(event) => updateField('status', event.target.value as ContentStatus)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                  <p className="adp-hint-text">{publicationNotes[values.status]}</p>
                  {kind === 'articles' && values.slug ? <p className="adp-public-url"><span>URL publik</span><code>/berita/{values.slug}</code></p> : null}
                  {kind === 'articles' && documentId && values.status === 'published' ? <Link className="adm-btn adm-btn--ghost" href={`/berita/${values.slug}`} target="_blank" rel="noopener noreferrer">Lihat halaman publik ↗</Link> : null}
                  {kind === 'publicData' && values.slug ? <p className="adp-public-url"><span>URL publik</span><code>/data/{values.slug}</code></p> : null}
                  {kind === 'publicData' && documentId && values.status === 'published' ? <Link className="adm-btn adm-btn--ghost" href={`/data/${values.slug}`} target="_blank" rel="noopener noreferrer">Lihat halaman publik ↗</Link> : null}
                </div>
              </div>

              <div className="adm-panel adp-publish-card">
                <div className="adm-panel-head"><h2>Checklist redaksi</h2></div>
                <ul className="adp-checklist">
                  <li>Judul jelas dan tidak terlalu panjang</li>
                  <li>Ringkasan menjelaskan inti konten</li>
                  {kind === 'articles' ? <li>Cover punya izin publikasi</li> : null}
                  {kind === 'publicData' ? <li>Sumber, periode, dan akses resource sudah jelas</li> : null}
                  <li>Nama, tanggal, dan tautan sudah benar</li>
                </ul>
              </div>
            </aside>
          </div>

          {errors.length > 0 ? <div className="adp-inline-error" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
          {feedback ? <p className="adp-inline-success" role="status">{feedback}</p> : null}

          <footer className="adp-editor-actions">
            <div><span>{isDirty ? 'Perubahan belum disimpan' : 'Semua perubahan tersimpan'}</span><Link href={config.basePath}>Batal dan kembali</Link></div>
            <div>
              <button className="adm-btn adm-btn--ghost" type="submit" name="intent" value="save" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : values.status === 'draft' ? 'Simpan draft' : 'Simpan perubahan'}</button>
              {values.status !== 'published' ? <button className="adm-btn" type="submit" name="intent" value="publish" disabled={isSubmitting}>Terbitkan {config.label.toLowerCase()}</button> : null}
            </div>
          </footer>
        </form>
      )}
    </AdminShell>
  )
}
