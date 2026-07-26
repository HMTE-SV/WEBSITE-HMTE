'use client'

import { useCallback, useEffect, useState } from 'react'
import { divisions } from '@/data/divisions'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import {
  buildOrganizationPayload,
  getEmptyOrganizationFormValues,
  organizationCrudConfigs,
  organizationDocumentToFormValues,
  type ManagedOrganizationDocument,
  type OrganizationFormValues,
  type OrganizationKind,
} from '@/lib/admin/organization-crud'
import {
  createContentDocument,
  deleteContentDocument,
  listContentDocuments,
  updateContentDocument,
} from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { DivisionCode, ProgramStatus } from '@/types/content'

const organizationKinds: OrganizationKind[] = ['leaders', 'divisions', 'programs']
const programStatuses: ProgramStatus[] = ['Terjadwal', 'Berkala']

function getDocumentTitle(kind: OrganizationKind, document: ManagedOrganizationDocument) {
  if (kind === 'divisions' && 'shortName' in document) {
    return `${document.shortName} - ${document.name}`
  }

  return document.name
}

function getDocumentDetail(kind: OrganizationKind, document: ManagedOrganizationDocument) {
  if (kind === 'leaders' && 'role' in document) {
    return `${document.role}${document.divisionCode ? ` / ${document.divisionCode}` : ''}`
  }

  if (kind === 'programs' && 'desc' in document) {
    return `${document.status} / ${document.date}`
  }

  if ('description' in document) {
    return document.description
  }

  return document.id
}

export function AdminOrganizationManager() {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)
  const [kind, setKind] = useState<OrganizationKind>('leaders')
  const [items, setItems] = useState<ManagedOrganizationDocument[]>([])
  const [editingId, setEditingId] = useState('')
  const [values, setValues] = useState<OrganizationFormValues>(() => getEmptyOrganizationFormValues('leaders'))
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyId, setBusyId] = useState('')

  const config = organizationCrudConfigs[kind]

  const loadItems = useCallback(async () => {
    if (!hasFirebaseConfig()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const documents = await listContentDocuments<ManagedOrganizationDocument>(config.collectionName)
      setItems(documents.sort((first, second) => first.order - second.order))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data organisasi.')
    } finally {
      setIsLoading(false)
    }
  }, [config.collectionName])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadItems()
    }, 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [loadItems])

  function changeKind(nextKind: OrganizationKind) {
    setKind(nextKind)
    setEditingId('')
    setValues(getEmptyOrganizationFormValues(nextKind))
    setError('')
    setFeedback('')
  }

  function updateField<Field extends keyof OrganizationFormValues>(field: Field, value: OrganizationFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function startEdit(document: ManagedOrganizationDocument) {
    setEditingId(document.id)
    setValues(organizationDocumentToFormValues(kind, document))
    setError('')
    setFeedback('')
  }

  function resetForm() {
    setEditingId('')
    setValues(getEmptyOrganizationFormValues(kind))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')

    if (!hasFirebaseConfig()) {
      setError('Firebase belum dikonfigurasi.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildOrganizationPayload(kind, values)

      if (editingId) {
        await updateContentDocument(config.collectionName, editingId, payload)
        setFeedback(`${config.label} berhasil diperbarui.`)
      } else {
        await createContentDocument(config.collectionName, payload)
        setFeedback(`${config.label} berhasil ditambahkan.`)
      }

      resetForm()
      await loadItems()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan data organisasi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(document: ManagedOrganizationDocument) {
    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await updateContentDocument(config.collectionName, document.id, {
        active: !document.active,
      })
      setFeedback('Status aktif berhasil diperbarui.')
      await loadItems()
    } catch (activeError) {
      setError(activeError instanceof Error ? activeError.message : 'Gagal memperbarui status.')
    } finally {
      setBusyId('')
    }
  }

  async function handleDelete(document: ManagedOrganizationDocument) {
    const confirmed = window.confirm(`Hapus "${getDocumentTitle(kind, document)}"?`)

    if (!confirmed) {
      return
    }

    setBusyId(document.id)
    setError('')
    setFeedback('')

    try {
      await deleteContentDocument(config.collectionName, document.id)
      setFeedback(`${config.label} berhasil dihapus.`)
      await loadItems()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus data organisasi.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <AdminShell
      activeHref="/admin/leaders"
      description="Kelola pengurus, unsur organisasi, program kerja, urutan tampil, dan status aktif."
      kicker="Kepengurusan"
      title="Kelola organisasi"
    >
      <div className="admin-tabbar" role="tablist" aria-label="Data organisasi">
        {organizationKinds.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={kind === item}
            onClick={() => changeKind(item)}
            key={item}
          >
            {organizationCrudConfigs[item].label}
          </button>
        ))}
      </div>

      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola data organisasi dari Firestore."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : (
        <>
          {canWrite ? (
            <form className="admin-content-form" onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="org-name">{kind === 'divisions' ? 'Nama divisi' : 'Nama'}</label>
                <input id="org-name" value={values.name} onChange={(event) => updateField('name', event.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="org-order">Urutan</label>
                <input
                  id="org-order"
                  type="number"
                  value={values.order}
                  onChange={(event) => updateField('order', event.target.value)}
                />
              </div>
            </div>

            {kind === 'leaders' ? (
              <>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-role">Jabatan</label>
                    <input id="org-role" value={values.role} onChange={(event) => updateField('role', event.target.value)} />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-division">Divisi</label>
                    <select
                      id="org-division"
                      value={values.divisionCode}
                      onChange={(event) => updateField('divisionCode', event.target.value as DivisionCode)}
                    >
                      {divisions.map((division) => (
                        <option value={division.code} key={division.code}>
                          {division.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="org-photo">URL foto</label>
                  <input id="org-photo" value={values.photo} onChange={(event) => updateField('photo', event.target.value)} />
                </div>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-email">Email</label>
                    <input id="org-email" value={values.email} onChange={(event) => updateField('email', event.target.value)} />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-instagram">Instagram</label>
                    <input
                      id="org-instagram"
                      value={values.instagram}
                      onChange={(event) => updateField('instagram', event.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="org-bio">Bio</label>
                  <textarea id="org-bio" value={values.bio} onChange={(event) => updateField('bio', event.target.value)} rows={4} />
                </div>
              </>
            ) : null}

            {kind === 'divisions' ? (
              <>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-code">Kode</label>
                    <select id="org-code" value={values.code} onChange={(event) => updateField('code', event.target.value as DivisionCode)}>
                      {divisions.map((division) => (
                        <option value={division.code} key={division.code}>
                          {division.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-short-name">Nama pendek</label>
                    <input
                      id="org-short-name"
                      value={values.shortName}
                      onChange={(event) => updateField('shortName', event.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="org-description">Deskripsi</label>
                  <textarea
                    id="org-description"
                    value={values.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    rows={5}
                  />
                </div>
              </>
            ) : null}

            {kind === 'programs' ? (
              <>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-program-division">Divisi</label>
                    <select
                      id="org-program-division"
                      value={values.divisionCode}
                      onChange={(event) => updateField('divisionCode', event.target.value as DivisionCode)}
                    >
                      {divisions.map((division) => (
                        <option value={division.code} key={division.code}>
                          {division.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-program-status">Status program</label>
                    <select
                      id="org-program-status"
                      value={values.programStatus}
                      onChange={(event) => updateField('programStatus', event.target.value as ProgramStatus)}
                    >
                      {programStatuses.map((status) => (
                        <option value={status} key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-date">Tanggal</label>
                    <input id="org-date" value={values.date} onChange={(event) => updateField('date', event.target.value)} />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-desc">Deskripsi singkat</label>
                    <input id="org-desc" value={values.desc} onChange={(event) => updateField('desc', event.target.value)} />
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="org-months">Bulan pelaksanaan</label>
                  <input
                    id="org-months"
                    value={values.months}
                    onChange={(event) => updateField('months', event.target.value)}
                    placeholder="3, 6, 9, 12"
                    aria-describedby="org-months-hint"
                  />
                  <p className="admin-field-hint" id="org-months-hint">
                    Angka 1-12 dipisah koma. Ini yang menggambar tanda program di peta dua belas
                    bulan halaman Agenda — kalau dikosongkan, program tetap terbit tapi tidak muncul
                    di peta.
                  </p>
                </div>
              </>
            ) : null}

            <label className="admin-check-row">
              <input type="checkbox" checked={values.active} onChange={(event) => updateField('active', event.target.checked)} />
              Aktif dan tampil di publik
            </label>

            {error ? (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            ) : null}
            {feedback ? <p className="admin-form-success">{feedback}</p> : null}

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : editingId ? 'Update data' : 'Tambah data'}
              </button>
              {editingId ? (
                <button className="admin-secondary-button" type="button" onClick={resetForm}>
                  Batal edit
                </button>
              ) : null}
            </div>
            </form>
          ) : (
            <AdminEmptyState
              body="Role viewer dapat membaca data organisasi, tetapi tidak dapat menambah, mengubah, atau menghapusnya."
              kicker="Akses"
              title="Mode lihat saja"
            />
          )}

          {isLoading ? (
            <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data organisasi..." />
          ) : items.length === 0 ? (
            <AdminEmptyState
              body={`Tambahkan ${config.label.toLowerCase()} pertama untuk mulai mengelola data organisasi.`}
              title={`${config.label} belum ada.`}
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Detail</th>
                    <th>Status</th>
                    <th>Urutan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{getDocumentTitle(kind, item)}</strong>
                      </td>
                      <td>{getDocumentDetail(kind, item)}</td>
                      <td>
                        <span className={`admin-status-badge ${item.active ? 'published' : 'draft'}`}>
                          {item.active ? 'active' : 'inactive'}
                        </span>
                      </td>
                      <td>{item.order}</td>
                      <td>
                        {canWrite ? (
                          <div className="admin-table-actions">
                            <button type="button" onClick={() => startEdit(item)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => void handleToggleActive(item)}
                            >
                              {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => void handleDelete(item)}
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <span>Lihat saja</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}
