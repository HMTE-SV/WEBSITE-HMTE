'use client'

import { useEffect, useState } from 'react'
import { divisions } from '@/data/divisions'
import { AdminEmptyState } from './AdminEmptyState'
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
 */

type AdminUserDocument = FirestoreDocument & {
  uid: string
  email: string
  displayName?: string | null
  role: AdminRole
  divisionCode?: DivisionCode
  active: boolean
}

const roleLabels: Record<AdminRole, string> = {
  superadmin: 'Superadmin',
  editor: 'Editor',
  viewer: 'Viewer',
}

export function AdminUsersManager() {
  const session = useAdminSession()
  const [users, setUsers] = useState<AdminUserDocument[]>([])
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(hasFirebaseConfig())
  const [busyId, setBusyId] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('editor')
  const [newDivision, setNewDivision] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [invite, setInvite] = useState<(CreateAccountResult & { email: string }) | null>(null)

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

  async function patchUser(user: AdminUserDocument, changes: Omit<UpdateAccountInput, 'uid'>) {
    setBusyId(user.id)
    setError('')
    setFeedback('')

    try {
      await updateAdminAccount({ ...changes, uid: user.uid })
      setFeedback(`Wewenang ${user.email} diperbarui. Perubahan berlaku setelah dia masuk ulang.`)
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : 'Gagal memperbarui akun admin.')
    } finally {
      setBusyId('')
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setIsCreating(true)
    setError('')
    setFeedback('')
    setInvite(null)

    try {
      const result = await createAdminAccount({
        displayName: newName.trim() || undefined,
        divisionCode: newRole === 'editor' ? newDivision : undefined,
        email: newEmail,
        role: newRole,
      })

      setInvite({ ...result, email: newEmail.trim().toLowerCase() })
      setNewEmail('')
      setNewName('')
      setNewDivision('')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Gagal membuat akun admin.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AdminShell
      activeHref="/admin/users"
      description="Buat akun pengurus dan tetapkan bidangnya. Bidang inilah yang membatasi data mana yang boleh diubah seorang editor."
      kicker="Sistem"
      title="Akun admin"
    >
      {!hasFirebaseConfig() ? (
        <AdminEmptyState
          body="Isi .env.local sesuai FIREBASE_SETUP.md agar daftar akun admin dapat dimuat."
          kicker="Konfigurasi"
          title="Firebase belum siap."
        />
      ) : (
        <>
          <form className="admin-account-form" onSubmit={(event) => void handleCreate(event)}>
            <h2>Tambah akun pengurus</h2>
            <div className="admin-account-form-grid">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="nama@mail.ugm.ac.id"
                />
              </label>
              <label>
                <span>Nama (opsional)</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nama pengurus"
                />
              </label>
              <label>
                <span>Role</span>
                <select value={newRole} onChange={(event) => setNewRole(event.target.value as AdminRole)}>
                  {adminRoles.map((role) => (
                    <option value={role} key={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bidang</span>
                <select
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
              </label>
            </div>
            <button className="admin-primary-button" type="submit" disabled={isCreating}>
              {isCreating ? 'Membuat akun...' : 'Buat akun'}
            </button>
          </form>

          {invite ? (
            <div className="admin-schedule-preview" role="status">
              <span className="admin-schedule-preview-kicker">
                {invite.created ? 'Akun dibuat' : 'Akun yang sudah ada dipakai ulang'}
              </span>
              <strong>Kirim tautan ini ke {invite.email}</strong>
              <p>
                Tautan ini untuk menyetel sandinya sendiri, dan hanya berlaku sekali. Jangan
                membuatkan sandi lalu mengirimkannya.
              </p>
              <textarea className="admin-invite-link" readOnly rows={3} value={invite.resetLink} />
            </div>
          ) : null}

          {error ? (
            <p className="admin-form-error" role="alert">
              {error}
            </p>
          ) : null}
          {feedback ? <p className="admin-form-success">{feedback}</p> : null}

          {isLoading ? (
            <AdminEmptyState body="Mohon tunggu sebentar." kicker="Memuat" title="Mengambil daftar akun..." />
          ) : users.length === 0 ? (
            <AdminEmptyState
              body="Buat akun pertama lewat formulir di atas."
              title="Akun admin belum ada."
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Bidang</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    // Superadmin tidak terikat bidang, jadi kolomnya tidak
                    // relevan. Menampilkan pemilih yang tidak berpengaruh apa
                    // pun hanya mengundang salah paham soal wewenangnya.
                    const needsDivision = user.role === 'editor'
                    const isSelf = user.uid === session.uid

                    return (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.email}</strong>
                          {isSelf ? <small> (kamu)</small> : null}
                        </td>
                        <td>
                          <select
                            value={user.role}
                            disabled={busyId === user.id || isSelf}
                            onChange={(event) => void patchUser(user, { role: event.target.value as AdminRole })}
                            aria-label={`Role untuk ${user.email}`}
                          >
                            {adminRoles.map((role) => (
                              <option value={role} key={role}>
                                {roleLabels[role]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {needsDivision ? (
                            <select
                              value={user.divisionCode || ''}
                              disabled={busyId === user.id || isSelf}
                              onChange={(event) => void patchUser(user, { divisionCode: event.target.value })}
                              aria-label={`Bidang untuk ${user.email}`}
                            >
                              <option value="">Belum ditetapkan</option>
                              {divisions.map((division) => (
                                <option value={division.code} key={division.code}>
                                  {division.shortName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>Semua bidang</span>
                          )}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${user.active ? 'published' : 'draft'}`}>
                            {user.active ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              disabled={busyId === user.id || isSelf}
                              onClick={() => void patchUser(user, { active: !user.active })}
                            >
                              {user.active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}
