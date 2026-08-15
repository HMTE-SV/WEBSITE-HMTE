'use client'

import { useEffect, useMemo, useState } from 'react'
import { divisions } from '@/data/divisions'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminDrawer } from './AdminDrawer'
import { useAdminSession } from './AdminSessionContext'
import { AdminShell } from './AdminShell'
import {
  createAdminAccount,
  updateAdminAccount,
  type CreateAccountResult,
  type UpdateAccountInput,
} from '@/lib/admin/accounts-api'
import { subscribeToContentDocuments } from '@/lib/firebase/content-services'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { adminRoles, type AdminRole } from '@/types/admin'
import {
  adminPermissionDefinitions,
  defaultEditorPermissions,
  normalizeAdminPermissions,
  type AdminPermission,
} from '@/lib/admin/permissions'
import type { DivisionCode } from '@/types/content'
import type { FirestoreDocument } from '@/types/firestore'

/*
 * Membuat akun admin dan menetapkan wewenangnya.
 *
 * Seluruh perubahan lewat /api/admin/accounts, tidak ada satu pun tulisan
 * langsung ke Firestore. Alasannya bukan kerapian: wewenang sesungguhnya ada di
 * custom claims, dan claims cuma bisa disetel Admin SDK di server. Menulis
 * dokumen dari sini hanya akan menghasilkan daftar yang berbohong soal siapa
 * boleh apa. firestore.rules pun sudah menutup jalan itu.
 *
 * Kata sandi tidak pernah diketik di sini. Server membuat akun dengan sandi
 * acak lalu menerbitkan tautan penyetelan, dan tautan itulah yang diteruskan ke
 * orangnya. Sandi yang diketik satu orang untuk dipakai orang lain adalah sandi
 * yang bocor sejak lahir.
 *
 * Mencabut akses (menonaktifkan akun) adalah satu-satunya tindakan merusak di
 * halaman ini, jadi satu-satunya yang wajib lewat modal konfirmasi tengah —
 * bukan laci, karena di sini menutupi segalanya memang gunanya: berhenti dulu.
 */

type AdminUserDocument = FirestoreDocument & {
  uid: string
  email: string
  displayName?: string | null
  role: AdminRole
  divisionCode?: DivisionCode
  permissions?: AdminPermission[]
  active: boolean
}

const roleLabels: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  editor: 'Operator',
  viewer: 'Viewer',
}

type Toast = { id: number; kind: 'ok' | 'danger'; message: string }

function PermissionGrid({
  role,
  value,
  onChange,
}: {
  role: AdminRole
  value: AdminPermission[]
  onChange: (value: AdminPermission[]) => void
}) {
  if (role === 'superadmin') {
    return (
      <div className="adm-permission-superadmin">
        <strong>Akses penuh</strong>
        <p>Superadmin selalu dapat membuka seluruh modul dan mengelola akun lain.</p>
      </div>
    )
  }

  return (
    <div className="adm-permission-groups">
      {(['Publikasi', 'Organisasi', 'Sistem'] as const).map((group) => (
        <fieldset className="adm-permission-group" key={group}>
          <legend>{group}</legend>
          {adminPermissionDefinitions.filter((item) => item.group === group).map((item) => {
            const checked = value.includes(item.key)
            return (
              <label className="adm-permission-option" key={item.key}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(
                    checked ? value.filter((permission) => permission !== item.key) : [...value, item.key],
                  )}
                />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </label>
            )
          })}
        </fieldset>
      ))}
    </div>
  )
}

export function AdminUsersManager() {
  const session = useAdminSession()
  const [users, setUsers] = useState<AdminUserDocument[]>([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')
  const [search, setSearch] = useState('')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('editor')
  const [newDivision, setNewDivision] = useState('')
  const [newPermissions, setNewPermissions] = useState<AdminPermission[]>([...defaultEditorPermissions])
  const [isCreating, setIsCreating] = useState(false)
  const [invite, setInvite] = useState<(CreateAccountResult & { email: string }) | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserDocument | null>(null)
  const [editTarget, setEditTarget] = useState<AdminUserDocument | null>(null)
  const [editRole, setEditRole] = useState<AdminRole>('editor')
  const [editDivision, setEditDivision] = useState('')
  const [editPermissions, setEditPermissions] = useState<AdminPermission[]>([])

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      return
    }

    return subscribeToContentDocuments<AdminUserDocument>('adminUsers', {
      onData: (documents) => {
        setUsers([...documents].sort((first, second) => first.email.localeCompare(second.email)))
        setIsLoading(false)
      },
      onError: (subscribeError) => {
        setError(subscribeError.message || 'Gagal memuat daftar akun admin.')
        setIsLoading(false)
      },
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function notify(kind: Toast['kind'], message: string) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, kind, message }))
  }

  async function patchUser(user: AdminUserDocument, changes: Omit<UpdateAccountInput, 'uid'>) {
    setBusyId(user.id)

    try {
      await updateAdminAccount({ ...changes, uid: user.uid })
      notify('ok', `Wewenang ${user.email} diperbarui. Perubahan berlaku setelah dia masuk ulang.`)
      return true
    } catch (patchError) {
      notify('danger', patchError instanceof Error ? patchError.message : 'Gagal memperbarui akun admin.')
      return false
    } finally {
      setBusyId('')
    }
  }

  async function confirmDeactivate() {
    const user = deactivateTarget
    if (!user) return
    setDeactivateTarget(null)
    await patchUser(user, { active: false })
  }

  function openCreateDrawer() {
    setNewEmail('')
    setNewName('')
    setNewRole('editor')
    setNewDivision('')
    setNewPermissions([...defaultEditorPermissions])
    setInvite(null)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(user: AdminUserDocument) {
    setEditTarget(user)
    setEditRole(user.role)
    setEditDivision(user.divisionCode || '')
    setEditPermissions(normalizeAdminPermissions(user.role, user.permissions))
  }

  async function saveAccess() {
    if (!editTarget) return
    const saved = await patchUser(editTarget, {
      divisionCode: editRole === 'editor' ? editDivision : '',
      permissions: editRole === 'superadmin' ? [] : editPermissions,
      role: editRole,
    })
    if (saved) setEditTarget(null)
  }

  function closeCreateDrawer() {
    setIsDrawerOpen(false)
    setInvite(null)
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setIsCreating(true)
    setInvite(null)

    try {
      const result = await createAdminAccount({
        displayName: newName.trim() || undefined,
        divisionCode: newRole === 'editor' ? newDivision : undefined,
        email: newEmail,
        permissions: newRole === 'superadmin' ? [] : newPermissions,
        role: newRole,
      })

      setInvite({ ...result, email: newEmail.trim().toLowerCase() })
      setNewEmail('')
      setNewName('')
      setNewDivision('')
      notify('ok', result.created ? 'Akun admin dibuat.' : 'Akun yang sudah ada dipakai ulang.')
    } catch (createError) {
      notify('danger', createError instanceof Error ? createError.message : 'Gagal membuat akun admin.')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('id-ID')
    if (!needle) return users
    return users.filter(
      (user) =>
        user.email.toLocaleLowerCase('id-ID').includes(needle) ||
        (user.displayName || '').toLocaleLowerCase('id-ID').includes(needle),
    )
  }, [users, search])

  // isDirty laci pembuatan: ada isian yang sudah diketik tapi belum jadi akun.
  const isCreateDirty = (
    Boolean(newEmail || newName || newDivision)
    || newRole !== 'editor'
    || newPermissions.join('|') !== defaultEditorPermissions.join('|')
  ) && !invite

  return (
    <AdminShell
      activeHref="/admin/users"
      title="Akun admin"
      actions={
        <button className="adm-btn" type="button" onClick={openCreateDrawer}>
          + Tambah akun
        </button>
      }
    >
      {!hasFirebaseConfig() ? (
        <div className="adm-empty">
          <h3>Firebase belum siap.</h3>
          <p>Isi .env.local sesuai FIREBASE_SETUP.md agar daftar akun admin dapat dimuat.</p>
        </div>
      ) : (
        <div className="adm-panel">
          <div className="adm-panel-head">
            <h2>Akun pengurus</h2>
            <p>{isLoading ? 'Memuat…' : `${filteredUsers.length} dari ${users.length} akun`}</p>
          </div>

          <div className="adm-org-toolbar">
            <div className="adm-org-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari email atau nama…"
                aria-label="Cari akun"
              />
            </div>
          </div>

          {error ? (
            <p className="adm-org-alert adm-org-alert--danger" role="alert">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div className="adm-org-skeleton-row" key={index}>
                  <span className="adm-skeleton" style={{ width: '45%', height: 14 }} />
                  <span className="adm-skeleton" style={{ width: '15%', height: 14 }} />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="adm-empty">
              <h3>{users.length === 0 ? 'Akun admin belum ada.' : 'Tidak ada yang cocok.'}</h3>
              <p>
                {users.length === 0
                  ? 'Buat akun pertama lewat tombol "+ Tambah akun" di kanan atas.'
                  : 'Ubah kata kunci pencarian di atas.'}
              </p>
              {users.length === 0 ? (
                <button className="adm-btn" type="button" onClick={openCreateDrawer}>
                  + Tambah akun
                </button>
              ) : null}
            </div>
          ) : (
            filteredUsers.map((user) => {
              // Superadmin tidak terikat bidang, jadi kolomnya tidak relevan.
              // Menampilkan pemilih yang tidak berpengaruh apa pun hanya
              // mengundang salah paham soal wewenangnya.
              const isSelf = user.uid === session.uid
              const userPermissions = normalizeAdminPermissions(user.role, user.permissions)

              return (
                <div className="adm-row adm-org-user-row" key={user.id}>
                  <div className="adm-row-main">
                    <strong>
                      {user.email}
                      {isSelf ? ' (kamu)' : ''}
                    </strong>
                    <small>{user.displayName || '—'}</small>
                  </div>

                  <span className="adm-org-readonly">{roleLabels[user.role]}</span>
                  <span className="adm-org-readonly">{user.role === 'editor' ? user.divisionCode || 'Belum ditetapkan' : 'Semua bidang'}</span>
                  <span className="adm-org-readonly">{user.role === 'superadmin' ? 'Semua modul' : `${userPermissions.length} modul`}</span>

                  <span className={`adm-chip ${user.active ? 'adm-chip--ok' : 'adm-chip--danger'}`}>
                    {user.active ? 'Aktif' : 'Nonaktif'}
                  </span>

                  <div className="adm-row-actions">
                    <button
                      className="adm-btn adm-btn--ghost"
                      type="button"
                      disabled={busyId === user.id || isSelf}
                      onClick={() => openEditDrawer(user)}
                    >
                      Atur akses
                    </button>
                    {user.active ? (
                      <button
                        className="adm-btn adm-btn--danger"
                        type="button"
                        disabled={busyId === user.id || isSelf}
                        onClick={() => setDeactivateTarget(user)}
                      >
                        Cabut akses
                      </button>
                    ) : (
                      <button
                        className="adm-btn adm-btn--ghost"
                        type="button"
                        disabled={busyId === user.id || isSelf}
                        onClick={() => void patchUser(user, { active: true })}
                      >
                        Aktifkan
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {isDrawerOpen ? (
        <AdminDrawer
          title="Tambah akun pengurus"
          isDirty={isCreateDirty}
          onClose={closeCreateDrawer}
          footer={
            invite ? (
              <button className="adm-btn" type="button" onClick={closeCreateDrawer}>
                Selesai
              </button>
            ) : (
              <>
                <button className="adm-btn adm-btn--ghost" type="button" onClick={closeCreateDrawer}>
                  Batal
                </button>
                <button
                  className={`adm-btn${isCreating ? ' is-loading' : ''}`}
                  type="submit"
                  form="adm-user-create-form"
                  disabled={isCreating}
                >
                  {isCreating ? 'Membuat akun…' : 'Buat akun'}
                </button>
              </>
            )
          }
        >
          {invite ? (
            <div className="adm-org-schedule-preview" role="status">
              <span>{invite.created ? 'Akun dibuat' : 'Akun yang sudah ada dipakai ulang'}</span>
              <strong>Kirim tautan ini ke {invite.email}</strong>
              <p>
                Tautan ini untuk menyetel sandinya sendiri, dan hanya berlaku sekali. Jangan
                membuatkan sandi lalu mengirimkannya.
              </p>
              <textarea className="adm-org-invite-link" readOnly rows={3} value={invite.resetLink} />
            </div>
          ) : (
            <form id="adm-user-create-form" onSubmit={(event) => void handleCreate(event)}>
              <div className="adm-field">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="nama@mail.ugm.ac.id"
                />
              </div>
              <div className="adm-field">
                <label htmlFor="user-name">Nama (opsional)</label>
                <input
                  id="user-name"
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nama pengurus"
                />
              </div>
              <div className="adm-org-grid-2">
                <div className="adm-field">
                  <label htmlFor="user-role">Role</label>
                  <select id="user-role" value={newRole} onChange={(event) => {
                    const role = event.target.value as AdminRole
                    setNewRole(role)
                    setNewPermissions(normalizeAdminPermissions(role, undefined))
                  }}>
                    {adminRoles.map((role) => (
                      <option value={role} key={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="adm-field">
                  <label htmlFor="user-division">Bidang</label>
                  <select
                    id="user-division"
                    value={newDivision}
                    disabled={newRole !== 'editor'}
                    required={newRole === 'editor'}
                    onChange={(event) => setNewDivision(event.target.value)}
                  >
                    <option value="">{newRole === 'editor' ? 'Pilih bidang' : 'Semua bidang'}</option>
                    {divisions.map((division) => (
                      <option value={division.code} key={division.code}>
                        {division.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="adm-permission-editor">
                <div className="adm-field-heading">
                  <strong>Akses modul</strong>
                  <small>{newRole === 'viewer' ? 'Viewer hanya dapat melihat modul yang dipilih.' : 'Operator dapat mengubah data pada modul yang dipilih.'}</small>
                </div>
                <PermissionGrid role={newRole} value={newPermissions} onChange={setNewPermissions} />
              </div>
            </form>
          )}
        </AdminDrawer>
      ) : null}

      {editTarget ? (
        <AdminDrawer
          title={`Atur akses ${editTarget.email}`}
          isDirty={editRole !== editTarget.role
            || editDivision !== (editTarget.divisionCode || '')
            || editPermissions.join('|') !== normalizeAdminPermissions(editTarget.role, editTarget.permissions).join('|')}
          onClose={() => setEditTarget(null)}
          footer={(
            <>
              <button className="adm-btn adm-btn--ghost" type="button" onClick={() => setEditTarget(null)}>Batal</button>
              <button className="adm-btn" type="button" disabled={busyId === editTarget.id || (editRole === 'editor' && !editDivision)} onClick={() => void saveAccess()}>
                {busyId === editTarget.id ? 'Menyimpan…' : 'Simpan akses'}
              </button>
            </>
          )}
        >
          <div className="adm-org-grid-2">
            <div className="adm-field">
              <label htmlFor="edit-user-role">Role</label>
              <select id="edit-user-role" value={editRole} onChange={(event) => {
                const role = event.target.value as AdminRole
                setEditRole(role)
                setEditPermissions(normalizeAdminPermissions(role, editTarget.permissions))
              }}>
                {adminRoles.map((role) => <option value={role} key={role}>{roleLabels[role]}</option>)}
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor="edit-user-division">Bidang</label>
              <select id="edit-user-division" value={editDivision} disabled={editRole !== 'editor'} required={editRole === 'editor'} onChange={(event) => setEditDivision(event.target.value)}>
                <option value="">{editRole === 'editor' ? 'Pilih bidang' : 'Semua bidang'}</option>
                {divisions.map((division) => <option value={division.code} key={division.code}>{division.shortName}</option>)}
              </select>
            </div>
          </div>
          <div className="adm-permission-editor">
            <div className="adm-field-heading">
              <strong>Akses modul</strong>
              <small>Izin baru berlaku setelah akun tersebut masuk ulang atau tokennya diperbarui.</small>
            </div>
            <PermissionGrid role={editRole} value={editPermissions} onChange={setEditPermissions} />
          </div>
        </AdminDrawer>
      ) : null}

      {deactivateTarget ? (
        <AdminConfirmDialog
          body="Akun ini tidak akan bisa masuk ke panel admin sampai diaktifkan kembali."
          confirmLabel="Cabut akses"
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => void confirmDeactivate()}
          title={`Cabut akses ${deactivateTarget.email}?`}
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
