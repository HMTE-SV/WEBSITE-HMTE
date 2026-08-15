'use client'

import { useEffect, useMemo, useState } from 'react'
import { divisions } from '@/data/divisions'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminDrawer } from './AdminDrawer'
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
 * Judul halaman dan aksi utama per jenis data.
 *
 * Ketiganya dulu bertumpuk di balik satu menu "Kepengurusan" dengan tab di
 * dalamnya, jadi program kerja dan divisi praktis tidak pernah ditemukan
 * pengurus. Sekarang tiap jenis punya menu dan alamatnya sendiri, dan komponen
 * ini menerima `kind` sebagai prop, bukan menyimpannya sebagai state.
 */
const organizationPageCopy = {
  leaders: { href: '/admin/leaders', title: 'Kepengurusan', addLabel: 'Tambah pengurus' },
  divisions: { href: '/admin/divisions', title: 'Divisi', addLabel: 'Tambah divisi' },
  programs: { href: '/admin/programs', title: 'Program kerja', addLabel: 'Tambah program' },
} as const satisfies Record<OrganizationKind, { href: string; title: string; addLabel: string }>

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

type Toast = { id: number; kind: 'ok' | 'danger'; message: string }

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<ManagedOrganizationDocument | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState<DivisionCode | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [values, setValues] = useState<OrganizationFormValues>(() => {
    const base = getEmptyOrganizationFormValues(kind)
    const division = session.role === 'superadmin' ? null : session.divisionCode
    return division ? { ...base, divisionCode: division } : base
  })
  // Potret nilai form saat laci dibuka, dipakai untuk mendeteksi perubahan
  // belum tersimpan sebelum laci ditutup paksa. State, bukan ref: dibaca saat
  // render untuk menghitung `isDirty`, dan ref tidak boleh dibaca di situ.
  const [initialValues, setInitialValues] = useState<OrganizationFormValues | null>(null)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
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

  // Roti panggang hilang sendiri 4 detik, sesuai kosakata .adm-toast.
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function notify(kind: Toast['kind'], message: string) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, message }))
  }

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

  function openCreate() {
    const next = emptyValues()
    setEditingId('')
    setValues(next)
    setError('')
    setWarnings([])
    setInitialValues(next)
    setIsDrawerOpen(true)
  }

  function openEdit(document: ManagedOrganizationDocument) {
    const next = organizationDocumentToFormValues(kind, document, contacts[document.id]?.email || '')
    setEditingId(document.id)
    setValues(next)
    setError('')
    setWarnings([])
    setInitialValues(next)
    setIsDrawerOpen(true)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setEditingId('')
    setValues(emptyValues())
    setWarnings([])
    setInitialValues(null)
  }

  const isDirty = initialValues ? JSON.stringify(values) !== JSON.stringify(initialValues) : false

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
      const wasEditing = Boolean(editingId)

      if (editingId) {
        await updateContentDocument(config.collectionName, editingId, payload)
        await saveLeaderContact(editingId)
      } else {
        const createdId = await createContentDocument(config.collectionName, payload)
        await saveLeaderContact(createdId)
      }

      await requestRevalidation('organization')
      notify('ok', `${config.label} berhasil ${wasEditing ? 'diperbarui' : 'ditambahkan'}.`)
      closeDrawer()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan data organisasi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(document: ManagedOrganizationDocument) {
    setBusyId(document.id)

    try {
      await updateContentDocument(config.collectionName, document.id, {
        active: !document.active,
      })
      notify('ok', 'Status aktif berhasil diperbarui.')
      await requestRevalidation('organization')
    } catch (activeError) {
      notify('danger', activeError instanceof Error ? activeError.message : 'Gagal memperbarui status.')
    } finally {
      setBusyId('')
    }
  }

  // Tindakan merusak: konfirmasi dulu lewat modal tengah, bukan window.confirm
  // bawaan peramban yang tidak mengikuti sistem desain panel ini.
  async function confirmDelete() {
    const document = confirmTarget
    if (!document) return
    setConfirmTarget(null)
    setBusyId(document.id)

    try {
      await deleteContentDocument(config.collectionName, document.id)

      // Kontak tidak ikut terhapus sendiri. Firestore tidak punya cascade, dan
      // dokumen yatim di sini berarti email seseorang tetap tersimpan setelah
      // namanya dihapus dari kepengurusan.
      if (kind === 'leaders' && contacts[document.id]) {
        await deleteContentDocument('leaderContacts', document.id)
      }

      notify('ok', `${config.label} berhasil dihapus.`)
      if (editingId === document.id) closeDrawer()
      await requestRevalidation('organization')
    } catch (deleteError) {
      notify('danger', deleteError instanceof Error ? deleteError.message : 'Gagal menghapus data organisasi.')
    } finally {
      setBusyId('')
    }
  }

  useEffect(() => {
    if (!confirmTarget) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setConfirmTarget(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmTarget])

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

  // Pencarian nama + saring bidang/status. Ini yang membuat 71 baris pengurus
  // dan 37 baris program tetap satu pandang alih-alih menggulir buta.
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('id-ID')

    return visibleItems.filter((item) => {
      if (needle && !getDocumentTitle(kind, item).toLocaleLowerCase('id-ID').includes(needle)) {
        return false
      }
      if (divisionFilter && 'divisionCode' in item && item.divisionCode !== divisionFilter) {
        return false
      }
      if (statusFilter === 'active' && !item.active) return false
      if (statusFilter === 'inactive' && item.active) return false
      return true
    })
  }, [visibleItems, search, divisionFilter, statusFilter, kind])

  const editingDocument = editingId
    ? items.find((item) => item.id === editingId) ?? null
    : null

  const showDivisionFilter = kind !== 'divisions' && isSuperadmin

  return (
    <AdminShell
      activeHref={copy.href}
      title={copy.title}
      actions={
        canWriteHere ? (
          <button className="adm-btn" type="button" onClick={openCreate}>
            + {copy.addLabel}
          </button>
        ) : null
      }
    >
      {!hasFirebaseConfig() ? (
        <div className="adm-empty">
          <h3>Firebase belum siap.</h3>
          <p>Isi .env.local sesuai FIREBASE_SETUP.md agar admin dapat mengelola data organisasi dari Firestore.</p>
        </div>
      ) : (
        <div className="adm-panel">
          <div className="adm-panel-head">
            <h2>{config.label}</h2>
            <p>{isLoading ? 'Memuat…' : `${filteredItems.length} dari ${visibleItems.length} data`}</p>
          </div>

          <div className="adm-org-toolbar">
            <div className="adm-org-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={kind === 'divisions' ? 'Cari divisi…' : 'Cari nama…'}
                aria-label="Cari nama"
              />
            </div>
            {showDivisionFilter ? (
              <select
                value={divisionFilter}
                onChange={(event) => setDivisionFilter(event.target.value as DivisionCode | '')}
                aria-label="Saring bidang"
              >
                <option value="">Semua bidang</option>
                {divisions.map((division) => (
                  <option value={division.code} key={division.code}>
                    {division.shortName}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              aria-label="Saring status"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {!canWriteHere ? (
            <p className="adm-org-access-note">
              {hasNoDivision
                ? 'Akun ini belum ditugaskan ke bidang mana pun, jadi belum ada data yang boleh diubah. Minta superadmin menetapkannya lewat menu Akun Admin.'
                : kind === 'divisions'
                  ? 'Daftar unsur organisasi hanya bisa diubah superadmin, karena kode divisi di sini menentukan batas wewenang semua editor.'
                  : 'Role viewer dapat membaca data organisasi, tetapi tidak dapat menambah, mengubah, atau menghapusnya.'}
            </p>
          ) : null}

          {isLoading ? (
            <div aria-hidden="true">
              {[52, 52, 52].map((height, index) => (
                <div className="adm-org-skeleton-row" key={index}>
                  <span className="adm-skeleton" style={{ width: '40%', height: 14 }} />
                  <span className="adm-skeleton" style={{ width: '20%', height: 14 }} />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="adm-empty">
              <h3>{visibleItems.length === 0 ? `${config.label} belum ada.` : 'Tidak ada yang cocok.'}</h3>
              <p>
                {visibleItems.length === 0
                  ? `Tambahkan ${config.label.toLowerCase()} pertama untuk mulai mengelola data organisasi.`
                  : 'Ubah kata kunci pencarian atau saringan bidang/status di atas.'}
              </p>
              {canWriteHere && visibleItems.length === 0 ? (
                <button className="adm-btn" type="button" onClick={openCreate}>
                  + {copy.addLabel}
                </button>
              ) : null}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div className="adm-row" key={item.id}>
                <div className="adm-row-main">
                  <strong>{getDocumentTitle(kind, item)}</strong>
                  <small>{getDocumentDetail(kind, item)}</small>
                </div>
                <span className={`adm-chip ${item.active ? 'adm-chip--ok' : ''}`}>
                  {item.active ? 'Aktif' : 'Nonaktif'}
                </span>
                <div className="adm-row-actions">
                  {canWriteHere ? (
                    <>
                      <button className="adm-btn adm-btn--ghost" type="button" onClick={() => openEdit(item)}>
                        Sunting
                      </button>
                      <button
                        className="adm-btn adm-btn--ghost"
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void handleToggleActive(item)}
                      >
                        {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      {kind !== 'leaders' ? (
                        <button
                          className="adm-btn adm-btn--danger"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => setConfirmTarget(item)}
                        >
                          Hapus
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button className="adm-btn adm-btn--ghost" type="button" onClick={() => openEdit(item)}>
                      Lihat
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isDrawerOpen ? (
        <AdminDrawer
          title={editingId ? `Sunting ${config.label.toLowerCase()}` : `Tambah ${config.label.toLowerCase()}`}
          description={kind === 'leaders'
            ? 'Kelola identitas, penempatan, dan profil anggota dalam satu ruang kerja.'
            : kind === 'programs'
              ? 'Susun informasi utama, jadwal, dan isi halaman program secara bertahap.'
              : 'Perbarui data organisasi dengan susunan yang jelas dan terjaga.'}
          isDirty={canWriteHere && isDirty}
          onClose={closeDrawer}
          size="wide"
          footer={
            canWriteHere ? (
              <>
                <button className="adm-btn adm-btn--ghost" type="button" onClick={closeDrawer}>
                  Batal
                </button>
                <button
                  className={`adm-btn${isSubmitting ? ' is-loading' : ''}`}
                  type="submit"
                  form="adm-org-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Tambah data'}
                </button>
              </>
            ) : (
              <button className="adm-btn adm-btn--ghost" type="button" onClick={closeDrawer}>
                Tutup
              </button>
            )
          }
        >
          <form className={`adm-org-form adm-org-form--${kind}`} id="adm-org-form" onSubmit={handleSubmit}>
            {kind === 'leaders' ? (
              <div className="adm-org-editor-intro">
                <span>{values.photo ? 'Foto sudah dipilih' : 'Belum ada foto'}</span>
                <div>
                  <strong>{values.name || 'Anggota baru'}</strong>
                  <p>{values.role || 'Jabatan belum diisi'} · {values.divisionCode}</p>
                </div>
              </div>
            ) : null}

            {kind === 'programs' ? (
              <div className="adm-org-editor-intro adm-org-editor-intro--program">
                <span>{values.programStatus}</span>
                <div>
                  <strong>{values.name || 'Program baru'}</strong>
                  <p>{values.divisionCode} · {schedulePreview.label}</p>
                </div>
              </div>
            ) : null}

            <section className={kind === 'leaders' || kind === 'programs' ? 'adm-org-editor-section' : undefined}>
              {kind === 'leaders' ? <header><span>01</span><div><h3>Identitas dan penempatan</h3><p>Data utama yang tampil di direktori kepengurusan.</p></div></header> : null}
              {kind === 'programs' ? <header><span>01</span><div><h3>Identitas program</h3><p>Nama, bidang pemilik, status, dan ringkasan untuk kartu publik.</p></div></header> : null}
            <div className="adm-org-grid-2">
              <div className="adm-field">
                <label htmlFor="org-name">{kind === 'divisions' ? 'Nama divisi' : 'Nama'}</label>
                <input
                  id="org-name"
                  value={values.name}
                  disabled={!canWriteHere}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </div>
              <div className="adm-field">
                <label htmlFor="org-order">Urutan</label>
                <input
                  id="org-order"
                  type="number"
                  value={values.order}
                  disabled={!canWriteHere}
                  onChange={(event) => updateField('order', event.target.value)}
                />
              </div>
            </div>

            {kind === 'leaders' ? (
              <>
                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-role">Jabatan</label>
                    <input
                      id="org-role"
                      value={values.role}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('role', event.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label htmlFor="org-division">Divisi</label>
                    <select
                      id="org-division"
                      disabled={!canWriteHere || isDivisionScoped}
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
              </>
            ) : null}

            {kind === 'programs' ? (
              <>
                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-program-division">Divisi</label>
                    <select
                      id="org-program-division"
                      disabled={!canWriteHere || isDivisionScoped}
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
                  <div className="adm-field">
                    <label htmlFor="org-program-status">Status program</label>
                    <select
                      id="org-program-status"
                      value={values.programStatus}
                      disabled={!canWriteHere}
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
                <div className="adm-field">
                  <label htmlFor="org-desc">Deskripsi singkat</label>
                  <textarea
                    id="org-desc"
                    value={values.desc}
                    disabled={!canWriteHere}
                    onChange={(event) => updateField('desc', event.target.value)}
                    rows={3}
                  />
                  <small>Dipakai pada kartu program. Usahakan ringkas dan langsung menjelaskan kegiatannya.</small>
                </div>
              </>
            ) : null}
            </section>

            {kind === 'leaders' ? (
              <section className="adm-org-editor-section">
                <header><span>02</span><div><h3>Kontak dan profil</h3><p>Email tetap internal; akun sosial dan bio dapat tampil ke publik.</p></div></header>
                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-email">Email (internal)</label>
                    <input
                      id="org-email"
                      type="email"
                      value={values.email}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('email', event.target.value)}
                    />
                    <small>Disimpan terpisah dan tidak pernah tampil di halaman publik.</small>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="org-batch">Angkatan</label>
                    <input
                      id="org-batch"
                      inputMode="numeric"
                      placeholder="2023"
                      value={values.batch}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('batch', event.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-instagram">Instagram</label>
                    <input
                      id="org-instagram"
                      value={values.instagram}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('instagram', event.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label htmlFor="org-linkedin">LinkedIn</label>
                    <input
                      id="org-linkedin"
                      value={values.linkedin}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('linkedin', event.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-field">
                  <label htmlFor="org-bio">Bio</label>
                  <textarea
                    id="org-bio"
                    value={values.bio}
                    disabled={!canWriteHere}
                    onChange={(event) => updateField('bio', event.target.value)}
                    rows={4}
                  />
                </div>
              </section>
            ) : null}

            {kind === 'divisions' ? (
              <>
                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-code">Kode</label>
                    <select
                      id="org-code"
                      value={values.code}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('code', event.target.value as DivisionCode)}
                    >
                      {divisions.map((division) => (
                        <option value={division.code} key={division.code}>
                          {division.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor="org-short-name">Nama pendek</label>
                    <input
                      id="org-short-name"
                      value={values.shortName}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('shortName', event.target.value)}
                    />
                  </div>
                </div>
                <div className="adm-field">
                  <label htmlFor="org-description">Deskripsi</label>
                  <textarea
                    id="org-description"
                    value={values.description}
                    disabled={!canWriteHere}
                    onChange={(event) => updateField('description', event.target.value)}
                    rows={5}
                  />
                </div>
              </>
            ) : null}

            {kind === 'programs' ? (
              <>
                <section className="adm-org-editor-section">
                  <header><span>02</span><div><h3>Jadwal dan agenda</h3><p>Tentukan bulan rencana atau tanggal pasti yang akan tampil di Agenda.</p></div></header>
                <fieldset className="adm-org-fieldset adm-org-fieldset--nested">
                  <legend>Peta bulan</legend>
                  <p className="adm-org-hint" id="org-months-hint">
                    Bulan perkiraan dari Buku Panduan. Ini yang menggambar arsir program di peta
                    dua belas bulan halaman Agenda. Boleh dikosongkan kalau tanggalnya sudah pasti.
                  </p>
                  <div className="adm-org-months" aria-describedby="org-months-hint">
                    {MONTH_NAMES_SHORT.map((label, index) => {
                      const month = index + 1
                      const isSelected = values.months.includes(month)

                      return (
                        <button
                          type="button"
                          className="adm-org-month-box"
                          disabled={!canWriteHere}
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

                <div className="adm-org-grid-2">
                  <div className="adm-field">
                    <label htmlFor="org-start-date">Tanggal mulai</label>
                    <input
                      id="org-start-date"
                      type="date"
                      value={values.startDate}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('startDate', event.target.value)}
                      aria-describedby="org-date-hint"
                    />
                  </div>
                  <div className="adm-field">
                    <label htmlFor="org-end-date">Tanggal selesai</label>
                    <input
                      id="org-end-date"
                      type="date"
                      value={values.endDate}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('endDate', event.target.value)}
                      aria-describedby="org-date-hint"
                    />
                  </div>
                </div>
                <p className="adm-org-hint" id="org-date-hint">
                  Kosongkan kalau tanggal belum fix. Kegiatan sehari cukup isi tanggal mulai.
                  Tanggal pasti selalu menang atas bulan rencana di atas.
                </p>

                <div className="adm-org-schedule-preview" aria-live="polite">
                  <span>Tampil di Agenda {agendaYear}</span>
                  <strong>{schedulePreview.label}</strong>
                  <p>
                    {schedulePreview.precision === 'exact'
                      ? `Tanggal pasti, ${schedulePreview.dayCount} hari. Kartu program menulis "${formatScheduleShort(schedulePreview)}".`
                      : schedulePreview.precision === 'planned'
                        ? `Baru bulan rencana, digambar redup tanpa angka hari. Kartu program menulis "${formatScheduleShort(schedulePreview)}".`
                        : 'Belum punya bulan maupun tanggal, jadi tidak digambar di peta tahun.'}
                  </p>
                </div>

                <div className="adm-field">
                  <label htmlFor="org-date">Label tanggal manual</label>
                  <input
                    id="org-date"
                    value={values.date}
                    disabled={!canWriteHere}
                    onChange={(event) => updateField('date', event.target.value)}
                    placeholder={schedulePreview.label}
                    aria-describedby="org-date-label-hint"
                  />
                  <small id="org-date-label-hint">
                    Biarkan kosong dan labelnya diambil dari jadwal di atas. Isi hanya kalau butuh
                    kalimat khusus, misalnya &quot;Menyesuaikan kalender akademik&quot;.
                  </small>
                </div>
                </section>

                {/*
                  Mulai di sini seluruh isi halaman rincian program. Sebelumnya
                  bagian ini tidak ada sama sekali di panel: ringkasan, tahapan,
                  dan poin fokus hanya dimiliki tiga program unggulan, dan
                  ketiganya ditulis sebagai konstanta di dalam repo. Program
                  keempat mustahil punya halaman yang berisi tanpa mengubah kode.
                */}
                <section className="adm-org-editor-section adm-org-editor-section--wide">
                  <header><span>03</span><div><h3>Isi halaman rincian</h3><p>Lengkapi konteks, tahapan, berkas, dan penanggung jawab yang dibutuhkan publik.</p></div></header>
                  <p className="adm-org-hint">
                    Semuanya boleh dikosongkan. Bagian yang kosong tidak digambar di halaman
                    program, bukan tampil sebagai kotak kosong.
                  </p>

                  <div className="adm-field">
                    <label htmlFor="org-summary">Ringkasan panjang</label>
                    <textarea
                      id="org-summary"
                      value={values.summary}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('summary', event.target.value)}
                      rows={4}
                      aria-describedby="org-summary-hint"
                    />
                    <small id="org-summary-hint">
                      Satu sampai tiga paragraf pendek. Deskripsi singkat di atas tetap dipakai
                      untuk kartu di katalog, jadi tidak perlu diulang persis.
                    </small>
                  </div>

                  <div className="adm-field">
                    <label htmlFor="org-objectives">Poin fokus</label>
                    <textarea
                      id="org-objectives"
                      value={values.objectives}
                      disabled={!canWriteHere}
                      onChange={(event) => updateField('objectives', event.target.value)}
                      rows={4}
                      placeholder={'Kesiapan pengurus menjalankan tanggung jawab organisasi\nPengembangan hard skill dan soft skill'}
                      aria-describedby="org-objectives-hint"
                    />
                    <small id="org-objectives-hint">
                      Satu poin per baris, tanpa tanda hubung di depan. Baris kosong diabaikan.
                    </small>
                  </div>

                  <div className="adm-org-repeat">
                    <div className="adm-org-repeat-head">
                      <span>Tahapan pelaksanaan</span>
                      <button
                        className="adm-btn adm-btn--ghost"
                        type="button"
                        disabled={!canWriteHere || values.timeline.length >= PROGRAM_TIMELINE_LIMIT}
                        onClick={() =>
                          updateField('timeline', [...values.timeline, emptyTimelineEntry()])
                        }
                      >
                        + Tambah tahapan
                      </button>
                    </div>

                    {values.timeline.length === 0 ? (
                      <p className="adm-org-hint">
                        Belum ada tahapan. Program satu hari memang tidak butuh ini.
                      </p>
                    ) : (
                      values.timeline.map((entry, index) => (
                        <div className="adm-org-repeat-row" key={`timeline-${index}`}>
                          <div className="adm-org-grid-2">
                            <div className="adm-field">
                              <label htmlFor={`org-timeline-label-${index}`}>Judul tahapan</label>
                              <input
                                id={`org-timeline-label-${index}`}
                                value={entry.label}
                                disabled={!canWriteHere}
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
                            <div className="adm-field">
                              <label htmlFor={`org-timeline-when-${index}`}>Waktu</label>
                              <input
                                id={`org-timeline-when-${index}`}
                                value={entry.when}
                                placeholder="April"
                                disabled={!canWriteHere}
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
                          <div className="adm-field">
                            <label htmlFor={`org-timeline-detail-${index}`}>Keterangan</label>
                            <textarea
                              id={`org-timeline-detail-${index}`}
                              value={entry.detail}
                              rows={2}
                              disabled={!canWriteHere}
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
                            className="adm-org-remove-link"
                            type="button"
                            disabled={!canWriteHere}
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

                  <div className="adm-org-repeat">
                    <div className="adm-org-repeat-head">
                      <span>Berkas dan tautan</span>
                      <button
                        className="adm-btn adm-btn--ghost"
                        type="button"
                        disabled={!canWriteHere || values.resources.length >= PROGRAM_RESOURCE_LIMIT}
                        onClick={() =>
                          updateField('resources', [...values.resources, emptyProgramResource()])
                        }
                      >
                        + Tambah berkas
                      </button>
                    </div>

                    {values.resources.length === 0 ? (
                      <p className="adm-org-hint">
                        Belum ada berkas. Tempel tautan proposal, formulir pendaftaran, atau
                        laporan yang sudah bisa diakses publik.
                      </p>
                    ) : (
                      values.resources.map((entry, index) => (
                        <div className="adm-org-repeat-row" key={`resource-${index}`}>
                          <div className="adm-org-grid-2">
                            <div className="adm-field">
                              <label htmlFor={`org-resource-label-${index}`}>Nama berkas</label>
                              <input
                                id={`org-resource-label-${index}`}
                                value={entry.label}
                                placeholder="Formulir pendaftaran"
                                disabled={!canWriteHere}
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
                            <div className="adm-field">
                              <label htmlFor={`org-resource-note-${index}`}>Keterangan</label>
                              <input
                                id={`org-resource-note-${index}`}
                                value={entry.note}
                                placeholder="PDF · 400 KB"
                                disabled={!canWriteHere}
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
                          <div className="adm-field">
                            <label htmlFor={`org-resource-url-${index}`}>Alamat</label>
                            <input
                              id={`org-resource-url-${index}`}
                              value={entry.url}
                              inputMode="url"
                              placeholder="https://"
                              disabled={!canWriteHere}
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
                            className="adm-org-remove-link"
                            type="button"
                            disabled={!canWriteHere}
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

                  <div className="adm-org-repeat">
                    <div className="adm-org-repeat-head">
                      <span>Penanggung jawab</span>
                    </div>
                    <p className="adm-org-hint" id="org-coordinator-hint">
                      Dipilih dari pengurus aktif bidang {values.divisionCode}. Yang tersimpan
                      namanya, bukan acuan ke dokumen, jadi menghapus pengurus tidak merusak
                      halaman program.
                    </p>

                    {divisionLeaders.length === 0 ? (
                      <p className="adm-org-hint">
                        Belum ada pengurus aktif di bidang ini. Tambahkan lewat menu Pengurus dulu.
                      </p>
                    ) : (
                      <div className="adm-org-chip-picker" aria-describedby="org-coordinator-hint">
                        {divisionLeaders.map((leader) => {
                          const isSelected = selectedCoordinatorKeys.has(
                            leader.name.trim().toLocaleLowerCase('id-ID'),
                          )

                          return (
                            <button
                              type="button"
                              key={leader.id}
                              disabled={!canWriteHere}
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
                      <div className="adm-org-chip-orphans">
                        <p className="adm-org-hint">
                          Nama berikut tersimpan di program ini tapi tidak ada di daftar pengurus
                          aktif bidang {values.divisionCode}. Tetap tampil di halaman publik sampai
                          dilepas.
                        </p>
                        <div className="adm-org-chip-picker">
                          {orphanCoordinators.map((name) => (
                            <button
                              type="button"
                              key={`orphan-${name}`}
                              disabled={!canWriteHere}
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
                </section>

                <label className="adm-org-check-row">
                  <input
                    type="checkbox"
                    checked={values.featured}
                    disabled={!canWriteHere}
                    onChange={(event) => updateField('featured', event.target.checked)}
                  />
                  Tandai sebagai program sorotan
                </label>
                <p className="adm-org-hint">
                  Program sorotan tampil paling besar di bagian atas /program-kerja. Sebelum ini,
                  ketiganya dipatok dari daftar nama di dalam kode, jadi mengganti nama program
                  lewat panel diam-diam menghilangkan sorotannya.
                </p>
              </>
            ) : null}

            <label className="adm-org-check-row">
              <input
                type="checkbox"
                checked={values.active}
                disabled={!canWriteHere}
                onChange={(event) => updateField('active', event.target.checked)}
              />
              Aktif dan tampil di publik
            </label>

            {kind === 'leaders' && editingDocument && canWriteHere ? (
              <section className="adm-danger-zone adm-org-danger-zone">
                <div>
                  <strong>Hapus anggota</strong>
                  <p>Penghapusan dipindahkan ke dalam editor agar tidak bisa tertekan saat mengelola daftar.</p>
                </div>
                <button
                  className="adm-btn adm-btn--danger"
                  type="button"
                  disabled={busyId === editingDocument.id}
                  onClick={() => setConfirmTarget(editingDocument)}
                >
                  Hapus anggota
                </button>
              </section>
            ) : null}

            {error ? (
              <p className="adm-org-alert adm-org-alert--danger" role="alert">
                {error}
              </p>
            ) : null}
            {warnings.length > 0 ? (
              <ul className="adm-org-alert adm-org-alert--warn" aria-live="polite">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </form>
        </AdminDrawer>
      ) : null}

      {confirmTarget ? (
        <AdminConfirmDialog
          body="Tindakan ini tidak bisa dibatalkan. Data akan hilang dari halaman publik."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => void confirmDelete()}
          title={`Hapus ${getDocumentTitle(kind, confirmTarget)}?`}
        />
      ) : null}

      {toast ? (
        <div className="adm-toasts">
          <div className={`adm-toast${toast.kind === 'danger' ? ' adm-toast--danger' : ''}`} role="status">
            {toast.message}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
