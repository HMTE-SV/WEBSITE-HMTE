'use client'

import { useEffect, useState } from 'react'
import { AdminEmptyState } from './AdminEmptyState'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { getContentDocument, writeContentDocumentAtId } from '@/lib/firebase/content-services'
import { SITE_SETTINGS_ID } from '@/lib/site-settings-data'
import {
  defaultSiteSettings,
  formatCabinetTitle,
  formatPeriodTitle,
  instagramLabel,
  normalizeInstagramHandle,
  normalizeSiteSettings,
  type SiteSettings,
} from '@/lib/site-settings'
import type { SiteSettingsDocument } from '@/types/firestore'

/*
 * Pengaturan identitas kepengurusan.
 *
 * Halaman ini dulu hanya kerangka kosong bertuliskan "akan didefinisikan
 * setelah model Firestore siap". Yang diisinya sekarang adalah teks yang
 * berulang di seluruh situs dan berganti bersamaan tepat sekali setahun: nama
 * kabinet, periode, tahun papan agenda, dan kanal resmi. Sebelum ini semuanya
 * menuntut sunting kode.
 *
 * Superadmin saja, dan itu ditegakkan firestore.rules, bukan oleh tombol yang
 * disembunyikan di sini. Yang di bawah cuma menjaga panel tidak menawarkan
 * sesuatu yang pasti ditolak server.
 */

type FormValues = Omit<SiteSettings, 'agendaYear'> & { agendaYear: string }

function toFormValues(settings: SiteSettings): FormValues {
  return { ...settings, agendaYear: String(settings.agendaYear) }
}

export function AdminSettingsManager() {
  const session = useAdminSession()
  const isSuperadmin = session.role === 'superadmin'

  const [values, setValues] = useState<FormValues>(() => toFormValues(defaultSiteSettings))
  const [documentExists, setDocumentExists] = useState(false)
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return
    }

    let cancelled = false

    getContentDocument<SiteSettingsDocument>('settings', SITE_SETTINGS_ID)
      .then((document) => {
        if (cancelled) return

        setDocumentExists(Boolean(document))
        setValues(toFormValues(normalizeSiteSettings(document as Record<string, unknown> | null)))
        setIsLoading(false)
      })
      .catch((loadError: unknown) => {
        if (cancelled) return

        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan.')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function updateField<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setFeedback('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setFeedback('')

    /*
     * Dibersihkan dulu lewat jalur yang sama dengan pembaca publik. Kalau
     * penyimpanan memakai aturan sendiri, tahun yang tertolak di sini bisa saja
     * diterima di sana, dan panel akan menampilkan nilai yang berbeda dari yang
     * benar-benar tampil di situs.
     */
    const settings = normalizeSiteSettings({ ...values, agendaYear: Number(values.agendaYear) })

    try {
      await writeContentDocumentAtId<SiteSettingsDocument>(
        'settings',
        SITE_SETTINGS_ID,
        { ...settings, updatedBy: session.email },
        documentExists,
      )

      setDocumentExists(true)
      setValues(toFormValues(settings))
      // Nama kabinet muncul di kaki setiap halaman, jadi tidak ada satu
      // kelompok pun yang cukup. Keduanya disegarkan.
      await requestRevalidation('organization')
      await requestRevalidation('articles')
      setFeedback('Pengaturan tersimpan dan halaman publik disegarkan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan pengaturan.')
    } finally {
      setIsSaving(false)
    }
  }

  const preview = normalizeSiteSettings({ ...values, agendaYear: Number(values.agendaYear) })

  return (
    <AdminShell
      activeHref="/admin/settings"
      description="Identitas kepengurusan yang berulang di seluruh situs. Satu-satunya tempat teks ini boleh diubah."
      kicker="Settings"
      title="Pengaturan situs"
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar pengaturan dapat dimuat."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : isLoading ? (
        <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil pengaturan..." />
      ) : (
        <form className="admin-account-form" onSubmit={(event) => void handleSubmit(event)}>
          {!isSuperadmin ? (
            <p className="admin-form-error" role="status">
              Hanya superadmin yang boleh mengubah pengaturan situs. Isian di bawah dikunci.
            </p>
          ) : null}

          <h2>Identitas kabinet</h2>
          <div className="admin-account-form-grid">
            <label>
              <span>Nama kabinet</span>
              <input
                required
                disabled={!isSuperadmin}
                value={values.cabinetName}
                onChange={(event) => updateField('cabinetName', event.target.value)}
                placeholder="Abya Vistara"
              />
            </label>
            <label>
              <span>Periode</span>
              <input
                required
                disabled={!isSuperadmin}
                value={values.periodLabel}
                onChange={(event) => updateField('periodLabel', event.target.value)}
                placeholder="2026/2027"
              />
            </label>
            <label>
              <span>Tahun papan agenda</span>
              <input
                inputMode="numeric"
                disabled={!isSuperadmin}
                value={values.agendaYear}
                onChange={(event) => updateField('agendaYear', event.target.value)}
                placeholder="2026"
              />
            </label>
            <label>
              <span>Instagram</span>
              <input
                disabled={!isSuperadmin}
                value={values.instagram}
                onChange={(event) => updateField('instagram', normalizeInstagramHandle(event.target.value))}
                placeholder="hmteugm"
              />
            </label>
            <label>
              <span>Email resmi</span>
              <input
                type="email"
                disabled={!isSuperadmin}
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </label>
            <label>
              <span>Semboyan penutup</span>
              <input
                disabled={!isSuperadmin}
                value={values.closingCheer}
                onChange={(event) => updateField('closingCheer', event.target.value)}
              />
            </label>
          </div>

          <div className="admin-field">
            <label htmlFor="settings-address">Konteks lembaga</label>
            <input
              id="settings-address"
              disabled={!isSuperadmin}
              value={values.address}
              onChange={(event) => updateField('address', event.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="settings-tagline">Tagline</label>
            <textarea
              id="settings-tagline"
              rows={3}
              disabled={!isSuperadmin}
              value={values.tagline}
              onChange={(event) => updateField('tagline', event.target.value)}
            />
          </div>

          {/*
            Pratinjau memakai nilai yang sudah dibersihkan, bukan isian mentah.
            Tahun yang ditolak karena di luar rentang karena itu terlihat kembali
            ke nilai bawaan di sini, sebelum disimpan, bukan setelahnya.
          */}
          <div className="admin-schedule-preview" role="status">
            <span className="admin-schedule-preview-kicker">Tampil di situs</span>
            <strong>
              {formatCabinetTitle(preview)} · {formatPeriodTitle(preview)}
            </strong>
            <p>
              Papan agenda menggambar tahun {preview.agendaYear}. Kanal resmi{' '}
              {instagramLabel(preview)}. Kaki halaman ditutup {preview.closingCheer}
            </p>
          </div>

          {error ? (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          ) : null}
          {feedback ? <p className="admin-form-success">{feedback}</p> : null}

          <button className="admin-primary-button" type="submit" disabled={!isSuperadmin || isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan pengaturan'}
          </button>
        </form>
      )}
    </AdminShell>
  )
}
