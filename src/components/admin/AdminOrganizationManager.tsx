'use client'

import { useEffect, useState } from 'react'
import { divisions } from '@/data/divisions'
import { AdminEmptyState } from './AdminEmptyState'
import { AdminImageField } from './AdminImageField'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import { canAdminWrite } from '@/data/admin-nav'
import {
  buildLeaderContactPayload,
  buildOrganizationPayload,
  emptyProgramResource,
  emptyTimelineEntry,
  getEmptyOrganizationFormValues,
  organizationCrudConfigs,
  organizationDocumentToFormValues,
  removeListRow,
  toggleCoordinator,
  toggleProgramMonth,
  updateListRow,
  validateOrganizationValues,
  type ManagedOrganizationDocument,
  type OrganizationFormValues,
  type OrganizationKind,
} from '@/lib/admin/organization-crud'
import {
  PROGRAM_RESOURCE_LIMIT,
  PROGRAM_TIMELINE_LIMIT,
  type ProgramResource,
  type ProgramTimelineEntry,
} from '@/lib/program-detail'
import {
  buildProgramSchedule,
  formatScheduleShort,
  getAgendaYear,
  MONTH_NAMES_SHORT,
} from '@/lib/program-schedule'
import {
  createContentDocument,
  deleteContentDocument,
  getContentDocument,
  subscribeToContentDocuments,
  updateContentDocument,
  writeContentDocumentAtId,
} from '@/lib/firebase/content-services'
import { requestRevalidation } from '@/lib/admin/revalidate'
import { SITE_SETTINGS_ID } from '@/lib/site-settings-data'
import { normalizeSiteSettings } from '@/lib/site-settings'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import type { DivisionCode, ProgramStatus } from '@/types/content'
import type { LeaderContactDocument, LeaderDocument, SiteSettingsDocument } from '@/types/firestore'

const programStatuses: ProgramStatus[] = ['Terjadwal', 'Berkala']

/**
 * Judul halaman per jenis data.
 *
 * Ketiganya dulu bertumpuk di balik satu menu "Kepengurusan" dengan tab di
 * dalamnya, jadi program kerja dan divisi praktis tidak pernah ditemukan
 * pengurus. Sekarang tiap jenis punya menu dan alamatnya sendiri, dan komponen
 * ini menerima `kind` sebagai prop, bukan menyimpannya sebagai state.
 */
const organizationPageCopy = {
  leaders: {
    href: '/admin/leaders',
    kicker: 'Organisasi',
    title: 'Kelola pengurus',
    description: 'Tambah, ubah, dan urutkan anggota kepengurusan beserta status tampil di publik.',
  },
  divisions: {
    href: '/admin/divisions',
    kicker: 'Organisasi',
    title: 'Kelola divisi',
    description: 'Atur unsur organisasi, kode divisi, dan deskripsi yang tampil di halaman divisi.',
  },
  programs: {
    href: '/admin/programs',
    kicker: 'Organisasi',
    title: 'Kelola program kerja',
    description: 'Atur program, bulan rencana, dan tanggal pasti yang menggambar papan agenda.',
  },
} as const satisfies Record<OrganizationKind, { href: string; kicker: string; title: string; description: string }>

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
    /*
     * Kolom ini juga menyebut apakah halaman rincian program sudah berisi.
     * Tanpa itu, satu-satunya cara pengurus tahu program mana yang halamannya
     * masih kosong adalah membuka tiga puluh tujuh baris satu per satu.
     */
    const hasDetail =
      Boolean(document.summary?.trim()) ||
      (document.objectives?.length || 0) > 0 ||
      (document.timeline?.length || 0) > 0

    const marks = [
      document.featured ? 'Sorotan' : '',
      hasDetail ? 'Rincian terisi' : 'Rincian kosong',
    ].filter(Boolean)

    return `${document.status} / ${document.date} · ${marks.join(' · ')}`
  }

  if ('description' in document) {
    return document.description
  }

  return document.id
}

type AdminOrganizationManagerProps = {
  kind: OrganizationKind
}

export function AdminOrganizationManager({ kind }: AdminOrganizationManagerProps) {
  const session = useAdminSession()
  const canWrite = canAdminWrite(session.role)

  /*
   * Editor terikat satu bidang; superadmin tidak.
   *
   * Pembatasan yang sesungguhnya ada di firestore.rules, dan itu yang menjaga
   * data. Yang di bawah ini semata-mata agar panel tidak menawarkan sesuatu
   * yang pasti ditolak server: menampilkan tombol Hapus untuk baris milik
   * bidang lain hanya menghasilkan pesan gagal yang membingungkan.
   */
  const isSuperadmin = session.role === 'superadmin'
  const lockedDivision = isSuperadmin ? null : session.divisionCode ?? null
  const isDivisionScoped = !isSuperadmin

  /*
   * Editor yang belum ditugaskan ke bidang mana pun. Rules menolak seluruh
   * tulisannya, jadi panel harus mengatakan alasannya alih-alih membiarkan ia
   * mengisi form lalu gagal menyimpan tanpa penjelasan.
   */
  const hasNoDivision = isDivisionScoped && !lockedDivision
  const [items, setItems] = useState<ManagedOrganizationDocument[]>([])
  const [contacts, setContacts] = useState<Record<string, LeaderContactDocument>>({})
  /*
   * Daftar pengurus, dipakai halaman program untuk memilih penanggung jawab.
   *
   * Kosong di halaman lain, dan langganannya pun tidak dipasang di sana. Kalau
   * halaman divisi ikut berlangganan, tiap pengurus yang membuka menu itu
   * membayar pembacaan seluruh collection `leaders` untuk daftar yang tidak
   * pernah dirender.
   */
  const [leaderRoster, setLeaderRoster] = useState<LeaderDocument[]>([])
  const [editingId, setEditingId] = useState('')
  const [values, setValues] = useState<OrganizationFormValues>(() => {
    const base = getEmptyOrganizationFormValues(kind)
    const division = session.role === 'superadmin' ? null : session.divisionCode
    return division ? { ...base, divisionCode: division } : base
  })
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyId, setBusyId] = useState('')

  /*
   * Tahun papan agenda datang dari settings/site, sama dengan yang dipakai
   * halaman publik. Nilai bawaan dari kode dipakai sampai pembacaannya selesai,
   * dan tetap dipakai kalau gagal. Kalau angka ini dibiarkan hardcode, panel
   * akan mengatakan "Tampil di Agenda 2026" untuk papan yang sebenarnya sudah
   * digambar tahun berikutnya, dan itu persis jenis ketidakcocokan yang sedang
   * kita berantas.
   */
  const [agendaYear, setAgendaYear] = useState(getAgendaYear())

  useEffect(() => {
    if (kind !== 'programs' || !hasFirebaseConfig()) {
      return
    }

    let cancelled = false

    getContentDocument<SiteSettingsDocument>('settings', SITE_SETTINGS_ID)
      .then((document) => {
        if (cancelled) return
        setAgendaYear(normalizeSiteSettings(document as Record<string, unknown> | null).agendaYear)
      })
      .catch(() => {
        // Sengaja diam. Tahun bawaan sudah terpasang.
      })

    return () => {
      cancelled = true
    }
  }, [kind])

  const config = organizationCrudConfigs[kind]

  /*
   * Langganan, bukan sekali ambil.
   *
   * Panel ini dipegang beberapa pengurus sekaligus. Dengan `getDocs`, dua orang
   * yang bekerja bersamaan tidak pernah melihat perubahan satu sama lain sampai
   * halamannya dimuat ulang, dan keduanya bisa mengedit baris yang sama dari
   * kondisi awal yang berbeda tanpa sadar.
   *
   * Efek sampingnya juga menghapus seluruh `await loadItems()` setelah simpan
   * dan hapus: perubahan sendiri sudah kembali lewat listener yang sama, jadi
   * memanggil ulang hanya menambah satu putaran baca yang tidak perlu.
   */
  useEffect(() => {
    // Tanpa konfigurasi, `isLoading` sudah lahir false dari useState di atas,
    // jadi tidak ada yang perlu disetel di sini.
    if (!hasFirebaseConfig()) {
      return
    }

    const unsubscribeItems = subscribeToContentDocuments<ManagedOrganizationDocument>(
      config.collectionName,
      {
        onData: (documents) => {
          setItems([...documents].sort((first, second) => first.order - second.order))
          setIsLoading(false)
        },
        onError: (subscribeError) => {
          setError(subscribeError.message || 'Gagal memuat data organisasi.')
          setIsLoading(false)
        },
      },
    )

    // Kontak hanya relevan di halaman pengurus, dan hanya bisa dibaca admin.
    const unsubscribeContacts = kind === 'leaders'
      ? subscribeToContentDocuments<LeaderContactDocument>('leaderContacts', {
          onData: (documents) => {
            setContacts(Object.fromEntries(documents.map((contact) => [contact.id, contact])))
          },
          onError: () => {
            // Sengaja diam. Kontak yang gagal dimuat berarti kolom email kosong,
            // dan itu tidak boleh menutupi daftar pengurus yang sudah tampil.
          },
        })
      : null

    // Sama alasannya: daftar pengurus hanya relevan di halaman program kerja,
    // sebagai sumber pilihan penanggung jawab.
    const unsubscribeLeaders = kind === 'programs'
      ? subscribeToContentDocuments<LeaderDocument>('leaders', {
          onData: (documents) => {
            setLeaderRoster(
              [...documents].sort((first, second) => first.order - second.order),
            )
          },
          onError: () => {
            // Sengaja diam. Gagal memuat daftar pengurus berarti pemilih
            // penanggung jawab kosong, dan itu tidak boleh menghalangi
            // penyuntingan program yang tidak ada hubungannya.
          },
        })
      : null

    return () => {
      unsubscribeItems()
      unsubscribeContacts?.()
      unsubscribeLeaders?.()
    }
  }, [config.collectionName, kind])

  /** Form kosong yang sudah dikunci ke bidang editor, kalau ia memang terikat. */
  function emptyValues(): OrganizationFormValues {
    const base = getEmptyOrganizationFormValues(kind)
    return lockedDivision ? { ...base, divisionCode: lockedDivision } : base
  }

  function updateField<Field extends keyof OrganizationFormValues>(field: Field, value: OrganizationFormValues[Field]) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function startEdit(document: ManagedOrganizationDocument) {
    setEditingId(document.id)
    setValues(organizationDocumentToFormValues(kind, document, contacts[document.id]?.email || ''))
    setError('')
    setWarnings([])
    setFeedback('')
  }

  function resetForm() {
    setEditingId('')
    setValues(emptyValues())
    setWarnings([])
  }

  /*
   * Kontak pengurus tinggal di dokumen terpisah supaya emailnya tidak ikut
   * terbaca publik. Konsekuensinya satu simpan menyentuh dua dokumen, dan
   * Firestore tidak menjanjikan keduanya berhasil bersamaan.
   *
   * Urutannya sengaja: dokumen pengurus dulu, kontak belakangan. Kalau yang
   * kedua gagal, yang tertinggal adalah pengurus tanpa email, dan itu bisa
   * diperbaiki dengan menyimpan ulang. Kalau urutannya dibalik, yang tertinggal
   * adalah email tanpa pemilik, dan tidak ada layar yang bisa menampilkannya.
   */
  async function saveLeaderContact(leaderId: string) {
    if (kind !== 'leaders') {
      return
    }

    await writeContentDocumentAtId<LeaderContactDocument>(
      'leaderContacts',
      leaderId,
      buildLeaderContactPayload(values),
      Boolean(contacts[leaderId]),
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFeedback('')

    if (!hasFirebaseConfig()) {
      setError('Firebase belum dikonfigurasi.')
      return
    }

    const validation = validateOrganizationValues(kind, values)
    setWarnings(validation.warnings)

    if (validation.errors.length > 0) {
      setError(validation.errors.join(' '))
      return
    }

    setIsSubmitting(true)

    try {
      const payload = buildOrganizationPayload(kind, values)

      if (editingId) {
        await updateContentDocument(config.collectionName, editingId, payload)
        await saveLeaderContact(editingId)
        setFeedback(`${config.label} berhasil diperbarui.`)
      } else {
        const createdId = await createContentDocument(config.collectionName, payload)
        await saveLeaderContact(createdId)
        setFeedback(`${config.label} berhasil ditambahkan.`)
      }

      await requestRevalidation('organization')
      resetForm()
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
      await requestRevalidation('organization')
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

      // Kontak tidak ikut terhapus sendiri. Firestore tidak punya cascade, dan
      // dokumen yatim di sini berarti email seseorang tetap tersimpan setelah
      // namanya dihapus dari kepengurusan.
      if (kind === 'leaders' && contacts[document.id]) {
        await deleteContentDocument('leaderContacts', document.id)
      }

      setFeedback(`${config.label} berhasil dihapus.`)
      await requestRevalidation('organization')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus data organisasi.')
    } finally {
      setBusyId('')
    }
  }

  // Pratinjau dihitung ulang tiap ketikan supaya pengurus melihat akibat
  // isiannya sebelum menyimpan. Ini yang mengubah pengisian tanggal dari
  // kewajiban administratif jadi umpan balik langsung.
  const schedulePreview = buildProgramSchedule({
    status: values.programStatus,
    date: '',
    months: values.months,
    startDate: values.startDate,
    endDate: values.endDate,
  })
  const copy = organizationPageCopy[kind]

  /*
   * Pilihan penanggung jawab dibatasi pengurus bidang yang sedang dipilih di
   * form, bukan bidang milik akun. Superadmin bisa memindahkan program antar
   * bidang, dan daftar nama harus ikut berpindah bersamanya.
   */
  const divisionLeaders = leaderRoster.filter(
    (leader) => leader.active && leader.divisionCode === values.divisionCode,
  )
  const selectedCoordinatorKeys = new Set(
    values.coordinators.map((name) => name.trim().toLocaleLowerCase('id-ID')),
  )
  /*
   * Nama yang tersimpan tapi tidak ada lagi di daftar pengurus bidang ini.
   *
   * Terjadi kalau orangnya dihapus, dinonaktifkan, pindah bidang, atau namanya
   * diperbaiki ejaannya. Ditampilkan terpisah dan tetap bisa dilepas, bukan
   * dibuang diam-diam: nama itu masih tercetak di halaman publik, dan pengurus
   * harus bisa melihat serta menghapusnya dari sini.
   */
  const orphanCoordinators = values.coordinators.filter(
    (name) =>
      !divisionLeaders.some(
        (leader) =>
          leader.name.trim().toLocaleLowerCase('id-ID') === name.trim().toLocaleLowerCase('id-ID'),
      ),
  )

  // Divisi tidak punya `divisionCode`; ia adalah divisinya sendiri. Menyaringnya
  // dengan field yang tidak ada akan mengosongkan seluruh daftar.
  const visibleItems = isDivisionScoped && kind !== 'divisions'
    ? items.filter((item) => 'divisionCode' in item && item.divisionCode === lockedDivision)
    : items

  // Editor tidak boleh menulis divisi sama sekali (aturan superadmin di rules),
  // dan editor tanpa bidang tidak boleh menulis apa pun di halaman ini.
  const canWriteHere = canWrite && !hasNoDivision && !(kind === 'divisions' && !isSuperadmin)

  return (
    <AdminShell
      activeHref={copy.href}
      description={copy.description}
      kicker={copy.kicker}
      title={copy.title}
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola data organisasi dari Firestore."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : (
        <>
          {canWriteHere ? (
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
                      disabled={isDivisionScoped}
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
                <AdminImageField
                  folder="pengurus"
                  hint="Potret tegak, wajah di sepertiga atas. Maksimal 3MB, format JPG, PNG, atau WebP."
                  label="Foto pengurus"
                  onChange={(url) => updateField('photo', url)}
                  value={values.photo}
                />
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-email">Email (internal)</label>
                    <input
                      id="org-email"
                      type="email"
                      value={values.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      aria-describedby="org-email-hint"
                    />
                    <p className="admin-field-hint" id="org-email-hint">
                      Disimpan terpisah dan tidak pernah tampil di halaman publik.
                    </p>
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-batch">Angkatan</label>
                    <input
                      id="org-batch"
                      inputMode="numeric"
                      placeholder="2023"
                      value={values.batch}
                      onChange={(event) => updateField('batch', event.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-instagram">Instagram</label>
                    <input
                      id="org-instagram"
                      value={values.instagram}
                      onChange={(event) => updateField('instagram', event.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    {/*
                      Isian ini dulu tidak ada padahal payload tetap menulis
                      values.linkedin. Akibatnya menyimpan pengurus lewat panel
                      diam-diam mengosongkan tautan LinkedIn-nya.
                    */}
                    <label htmlFor="org-linkedin">LinkedIn</label>
                    <input
                      id="org-linkedin"
                      value={values.linkedin}
                      onChange={(event) => updateField('linkedin', event.target.value)}
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
                      disabled={isDivisionScoped}
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
                <div className="admin-field">
                  <label htmlFor="org-desc">Deskripsi singkat</label>
                  <input id="org-desc" value={values.desc} onChange={(event) => updateField('desc', event.target.value)} />
                </div>

                <fieldset className="admin-month-picker">
                  <legend>Bulan rencana</legend>
                  <p className="admin-field-hint" id="org-months-hint">
                    Bulan perkiraan dari Buku Panduan. Ini yang menggambar arsir program di peta
                    dua belas bulan halaman Agenda. Boleh dikosongkan kalau tanggalnya sudah pasti.
                  </p>
                  <div className="admin-month-grid" aria-describedby="org-months-hint">
                    {MONTH_NAMES_SHORT.map((label, index) => {
                      const month = index + 1
                      const isSelected = values.months.includes(month)

                      return (
                        <button
                          type="button"
                          className="admin-month-box"
                          aria-pressed={isSelected}
                          onClick={() => updateField('months', toggleProgramMonth(values.months, month))}
                          key={label}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="org-start-date">Tanggal mulai</label>
                    <input
                      id="org-start-date"
                      type="date"
                      value={values.startDate}
                      onChange={(event) => updateField('startDate', event.target.value)}
                      aria-describedby="org-date-hint"
                    />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="org-end-date">Tanggal selesai</label>
                    <input
                      id="org-end-date"
                      type="date"
                      value={values.endDate}
                      onChange={(event) => updateField('endDate', event.target.value)}
                      aria-describedby="org-date-hint"
                    />
                  </div>
                </div>
                <p className="admin-field-hint" id="org-date-hint">
                  Kosongkan kalau tanggal belum fix. Kegiatan sehari cukup isi tanggal mulai.
                  Tanggal pasti selalu menang atas bulan rencana di atas.
                </p>

                <div className="admin-schedule-preview" aria-live="polite">
                  <span className="admin-schedule-preview-kicker">
                    Tampil di Agenda {agendaYear}
                  </span>
                  <strong>{schedulePreview.label}</strong>
                  <p>
                    {schedulePreview.precision === 'exact'
                      ? `Tanggal pasti, ${schedulePreview.dayCount} hari. Kartu program menulis "${formatScheduleShort(schedulePreview)}".`
                      : schedulePreview.precision === 'planned'
                        ? `Baru bulan rencana, digambar redup tanpa angka hari. Kartu program menulis "${formatScheduleShort(schedulePreview)}".`
                        : 'Belum punya bulan maupun tanggal, jadi tidak digambar di peta tahun.'}
                  </p>
                </div>

                <div className="admin-field">
                  <label htmlFor="org-date">Label tanggal manual</label>
                  <input
                    id="org-date"
                    value={values.date}
                    onChange={(event) => updateField('date', event.target.value)}
                    placeholder={schedulePreview.label}
                    aria-describedby="org-date-label-hint"
                  />
                  <p className="admin-field-hint" id="org-date-label-hint">
                    Biarkan kosong dan labelnya diambil dari jadwal di atas. Isi hanya kalau butuh
                    kalimat khusus, misalnya &quot;Menyesuaikan kalender akademik&quot;.
                  </p>
                </div>

                {/*
                  Mulai di sini seluruh isi halaman rincian program. Sebelumnya
                  bagian ini tidak ada sama sekali di panel: ringkasan, tahapan,
                  dan poin fokus hanya dimiliki tiga program unggulan, dan
                  ketiganya ditulis sebagai konstanta di dalam repo. Program
                  keempat mustahil punya halaman yang berisi tanpa mengubah kode.
                */}
                <fieldset className="admin-detail-group">
                  <legend>Isi halaman rincian</legend>
                  <p className="admin-field-hint">
                    Semuanya boleh dikosongkan. Bagian yang kosong tidak digambar di halaman
                    program, bukan tampil sebagai kotak kosong.
                  </p>

                  <div className="admin-field">
                    <label htmlFor="org-summary">Ringkasan panjang</label>
                    <textarea
                      id="org-summary"
                      value={values.summary}
                      onChange={(event) => updateField('summary', event.target.value)}
                      rows={4}
                      aria-describedby="org-summary-hint"
                    />
                    <p className="admin-field-hint" id="org-summary-hint">
                      Satu sampai tiga paragraf pendek. Deskripsi singkat di atas tetap dipakai
                      untuk kartu di katalog, jadi tidak perlu diulang persis.
                    </p>
                  </div>

                  <div className="admin-field">
                    <label htmlFor="org-objectives">Poin fokus</label>
                    <textarea
                      id="org-objectives"
                      value={values.objectives}
                      onChange={(event) => updateField('objectives', event.target.value)}
                      rows={4}
                      placeholder={'Kesiapan pengurus menjalankan tanggung jawab organisasi\nPengembangan hard skill dan soft skill'}
                      aria-describedby="org-objectives-hint"
                    />
                    <p className="admin-field-hint" id="org-objectives-hint">
                      Satu poin per baris, tanpa tanda hubung di depan. Baris kosong diabaikan.
                    </p>
                  </div>

                  <div className="admin-repeat">
                    <div className="admin-repeat-head">
                      <span>Tahapan pelaksanaan</span>
                      <button
                        type="button"
                        disabled={values.timeline.length >= PROGRAM_TIMELINE_LIMIT}
                        onClick={() =>
                          updateField('timeline', [...values.timeline, emptyTimelineEntry()])
                        }
                      >
                        Tambah tahapan
                      </button>
                    </div>

                    {values.timeline.length === 0 ? (
                      <p className="admin-field-hint">
                        Belum ada tahapan. Program satu hari memang tidak butuh ini.
                      </p>
                    ) : (
                      values.timeline.map((entry, index) => (
                        <div className="admin-repeat-row" key={`timeline-${index}`}>
                          <div className="admin-form-grid">
                            <div className="admin-field">
                              <label htmlFor={`org-timeline-label-${index}`}>Judul tahapan</label>
                              <input
                                id={`org-timeline-label-${index}`}
                                value={entry.label}
                                onChange={(event) =>
                                  updateField(
                                    'timeline',
                                    updateListRow<ProgramTimelineEntry>(values.timeline, index, {
                                      label: event.target.value,
                                    }),
                                  )
                                }
                              />
                            </div>
                            <div className="admin-field">
                              <label htmlFor={`org-timeline-when-${index}`}>Waktu</label>
                              <input
                                id={`org-timeline-when-${index}`}
                                value={entry.when}
                                placeholder="April"
                                onChange={(event) =>
                                  updateField(
                                    'timeline',
                                    updateListRow<ProgramTimelineEntry>(values.timeline, index, {
                                      when: event.target.value,
                                    }),
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="admin-field">
                            <label htmlFor={`org-timeline-detail-${index}`}>Keterangan</label>
                            <textarea
                              id={`org-timeline-detail-${index}`}
                              value={entry.detail}
                              rows={2}
                              onChange={(event) =>
                                updateField(
                                  'timeline',
                                  updateListRow<ProgramTimelineEntry>(values.timeline, index, {
                                    detail: event.target.value,
                                  }),
                                )
                              }
                            />
                          </div>
                          <button
                            className="admin-repeat-remove"
                            type="button"
                            onClick={() =>
                              updateField('timeline', removeListRow(values.timeline, index))
                            }
                          >
                            Hapus tahapan {index + 1}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="admin-repeat">
                    <div className="admin-repeat-head">
                      <span>Berkas dan tautan</span>
                      <button
                        type="button"
                        disabled={values.resources.length >= PROGRAM_RESOURCE_LIMIT}
                        onClick={() =>
                          updateField('resources', [...values.resources, emptyProgramResource()])
                        }
                      >
                        Tambah berkas
                      </button>
                    </div>

                    {values.resources.length === 0 ? (
                      <p className="admin-field-hint">
                        Belum ada berkas. Tempel tautan proposal, formulir pendaftaran, atau
                        laporan yang sudah bisa diakses publik.
                      </p>
                    ) : (
                      values.resources.map((entry, index) => (
                        <div className="admin-repeat-row" key={`resource-${index}`}>
                          <div className="admin-form-grid">
                            <div className="admin-field">
                              <label htmlFor={`org-resource-label-${index}`}>Nama berkas</label>
                              <input
                                id={`org-resource-label-${index}`}
                                value={entry.label}
                                placeholder="Formulir pendaftaran"
                                onChange={(event) =>
                                  updateField(
                                    'resources',
                                    updateListRow<ProgramResource>(values.resources, index, {
                                      label: event.target.value,
                                    }),
                                  )
                                }
                              />
                            </div>
                            <div className="admin-field">
                              <label htmlFor={`org-resource-note-${index}`}>Keterangan</label>
                              <input
                                id={`org-resource-note-${index}`}
                                value={entry.note}
                                placeholder="PDF · 400 KB"
                                onChange={(event) =>
                                  updateField(
                                    'resources',
                                    updateListRow<ProgramResource>(values.resources, index, {
                                      note: event.target.value,
                                    }),
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="admin-field">
                            <label htmlFor={`org-resource-url-${index}`}>Alamat</label>
                            <input
                              id={`org-resource-url-${index}`}
                              value={entry.url}
                              inputMode="url"
                              placeholder="https://"
                              onChange={(event) =>
                                updateField(
                                  'resources',
                                  updateListRow<ProgramResource>(values.resources, index, {
                                    url: event.target.value,
                                  }),
                                )
                              }
                            />
                          </div>
                          <button
                            className="admin-repeat-remove"
                            type="button"
                            onClick={() =>
                              updateField('resources', removeListRow(values.resources, index))
                            }
                          >
                            Hapus berkas {index + 1}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="admin-repeat">
                    <div className="admin-repeat-head">
                      <span>Penanggung jawab</span>
                    </div>
                    <p className="admin-field-hint" id="org-coordinator-hint">
                      Dipilih dari pengurus aktif bidang {values.divisionCode}. Yang tersimpan
                      namanya, bukan acuan ke dokumen, jadi menghapus pengurus tidak merusak
                      halaman program.
                    </p>

                    {divisionLeaders.length === 0 ? (
                      <p className="admin-field-hint">
                        Belum ada pengurus aktif di bidang ini. Tambahkan lewat menu Pengurus dulu.
                      </p>
                    ) : (
                      <div className="admin-chip-picker" aria-describedby="org-coordinator-hint">
                        {divisionLeaders.map((leader) => {
                          const isSelected = selectedCoordinatorKeys.has(
                            leader.name.trim().toLocaleLowerCase('id-ID'),
                          )

                          return (
                            <button
                              type="button"
                              key={leader.id}
                              aria-pressed={isSelected}
                              onClick={() =>
                                updateField(
                                  'coordinators',
                                  toggleCoordinator(values.coordinators, leader.name),
                                )
                              }
                            >
                              <b>{leader.name}</b>
                              <small>{leader.role}</small>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {orphanCoordinators.length > 0 ? (
                      <div className="admin-chip-orphans">
                        <p className="admin-field-hint">
                          Nama berikut tersimpan di program ini tapi tidak ada di daftar pengurus
                          aktif bidang {values.divisionCode}. Tetap tampil di halaman publik sampai
                          dilepas.
                        </p>
                        <div className="admin-chip-picker">
                          {orphanCoordinators.map((name) => (
                            <button
                              type="button"
                              key={`orphan-${name}`}
                              aria-pressed
                              onClick={() =>
                                updateField('coordinators', toggleCoordinator(values.coordinators, name))
                              }
                            >
                              <b>{name}</b>
                              <small>Lepas</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </fieldset>

                <label className="admin-check-row">
                  <input
                    type="checkbox"
                    checked={values.featured}
                    onChange={(event) => updateField('featured', event.target.checked)}
                  />
                  Tandai sebagai program sorotan
                </label>
                <p className="admin-field-hint">
                  Program sorotan tampil paling besar di bagian atas /program-kerja. Sebelum ini,
                  ketiganya dipatok dari daftar nama di dalam kode, jadi mengganti nama program
                  lewat panel diam-diam menghilangkan sorotannya.
                </p>
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
            {warnings.length > 0 ? (
              <ul className="admin-form-warning" aria-live="polite">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
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
              body={
                hasNoDivision
                  ? 'Akun ini belum ditugaskan ke bidang mana pun, jadi belum ada data yang boleh diubah. Minta superadmin menetapkannya lewat menu Akun Admin.'
                  : kind === 'divisions'
                    ? 'Daftar unsur organisasi hanya bisa diubah superadmin, karena kode divisi di sini yang menentukan batas wewenang semua editor.'
                    : 'Role viewer dapat membaca data organisasi, tetapi tidak dapat menambah, mengubah, atau menghapusnya.'
              }
              kicker="Akses"
              title={hasNoDivision ? 'Bidang belum ditetapkan' : 'Mode lihat saja'}
            />
          )}

          {isLoading ? (
            <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil data organisasi..." />
          ) : visibleItems.length === 0 ? (
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
                  {visibleItems.map((item) => (
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
                        {canWriteHere ? (
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
