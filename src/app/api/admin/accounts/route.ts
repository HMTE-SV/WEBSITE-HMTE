import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin-app'
import { requireSuperadmin } from '@/lib/firebase/require-superadmin'
import { buildAdminClaims, claimsAreEqual, readAdminClaims } from '@/lib/admin/claims'
import { isAdminRole, type AdminRole } from '@/types/admin'

/*
 * Pembuatan dan penugasan akun admin.
 *
 * Inilah yang menghapus langkah "buat dulu dokumennya di konsol Firebase".
 * Superadmin memasukkan email, role, dan bidang; server yang membuat akunnya,
 * menempelkan claims, dan mencatat dokumen direktorinya. Setelah itu editor
 * tinggal masuk, karena role-nya sudah ikut di dalam token.
 *
 * Kata sandi tidak pernah lewat sini. Akun dibuat dengan sandi acak yang tidak
 * ditampilkan ke siapa pun, lalu server menerbitkan tautan penyetelan sandi
 * yang diteruskan superadmin ke orangnya. Sandi yang diketik satu orang untuk
 * dipakai orang lain adalah sandi yang bocor sejak lahir.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AccountPayload = {
  email?: unknown
  displayName?: unknown
  role?: unknown
  divisionCode?: unknown
  uid?: unknown
  active?: unknown
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeDivision(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Menyimpan role dan bidang di dua tempat sekaligus: claims dan dokumen.
 *
 * Claims yang menentukan wewenang, dokumen yang bisa dibaca manusia dan
 * ditampilkan panel. Claims ditulis lebih dulu, supaya kegagalan di tengah
 * meninggalkan wewenang yang sudah benar dengan daftar yang tertinggal, bukan
 * daftar yang menjanjikan wewenang yang tidak pernah terpasang.
 */
async function applyAssignment(params: {
  uid: string
  email: string
  displayName: string | null
  role: AdminRole
  divisionCode: string
  active: boolean
  isNew: boolean
}) {
  const nextClaims = buildAdminClaims({
    active: params.active,
    divisionCode: params.divisionCode,
    role: params.role,
  })

  const account = await getAdminAuth().getUser(params.uid)
  const currentClaims = readAdminClaims(account.customClaims || {})

  if (!claimsAreEqual({ divisionCode: currentClaims.divisionCode, role: currentClaims.role ?? undefined }, nextClaims)) {
    await getAdminAuth().setCustomUserClaims(params.uid, nextClaims)
  }

  await getAdminDb().collection('adminUsers').doc(params.uid).set(
    {
      active: params.active,
      displayName: params.displayName,
      divisionCode: params.role === 'editor' ? params.divisionCode : FieldValue.delete(),
      email: params.email,
      role: params.role,
      uid: params.uid,
      updatedAt: FieldValue.serverTimestamp(),
      ...(params.isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
    },
    { merge: true },
  )
}

export async function POST(request: Request) {
  const gate = await requireSuperadmin(request)

  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const body = (await request.json().catch(() => ({}))) as AccountPayload
  const email = normalizeEmail(body.email)
  const role = body.role
  const divisionCode = normalizeDivision(body.divisionCode)
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''

  if (!email.includes('@')) {
    return badRequest('Email tidak sah.')
  }

  if (!isAdminRole(role)) {
    return badRequest('Role harus superadmin, editor, atau viewer.')
  }

  if (role === 'editor' && !divisionCode) {
    return badRequest('Editor wajib punya bidang. Tanpa bidang, akunnya tidak bisa mengubah apa pun.')
  }

  try {
    const auth = getAdminAuth()

    // Akun yang emailnya sudah terdaftar dipakai ulang, bukan ditolak. Pengurus
    // yang pernah punya akses lalu dicabut tetap punya akun Firebase-nya, dan
    // memaksa email baru hanya untuk mengembalikan aksesnya tidak masuk akal.
    const existing = await auth.getUserByEmail(email).catch(() => null)
    const account = existing
      ?? (await auth.createUser({
        displayName: displayName || undefined,
        email,
        emailVerified: false,
        password: `${randomUUID()}${randomUUID()}`,
      }))

    await applyAssignment({
      active: true,
      displayName: displayName || account.displayName || null,
      divisionCode,
      email,
      isNew: !existing,
      role,
      uid: account.uid,
    })

    const resetLink = await auth.generatePasswordResetLink(email)

    return NextResponse.json({
      created: !existing,
      resetLink,
      uid: account.uid,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat akun admin.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const gate = await requireSuperadmin(request)

  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const body = (await request.json().catch(() => ({}))) as AccountPayload
  const uid = typeof body.uid === 'string' ? body.uid.trim() : ''

  if (!uid) {
    return badRequest('uid wajib diisi.')
  }

  /*
   * Superadmin tidak boleh mengubah akunnya sendiri di sini. Satu klik salah
   * pada satu-satunya superadmin akan mengunci seluruh panel tanpa ada yang
   * tersisa untuk membukanya. Panel juga menonaktifkan tombolnya, tapi tombol
   * yang mati bukan penjagaan: pemeriksaannya harus ada di sisi yang berwenang.
   */
  if (uid === gate.uid) {
    return NextResponse.json(
      { error: 'Akun sendiri tidak bisa diubah dari sini, supaya panel tidak terkunci.' },
      { status: 400 },
    )
  }

  try {
    const snapshot = await getAdminDb().collection('adminUsers').doc(uid).get()
    const current = snapshot.data() || {}

    const role = body.role === undefined ? current.role : body.role
    const active = typeof body.active === 'boolean' ? body.active : current.active !== false
    const divisionCode = body.divisionCode === undefined
      ? normalizeDivision(current.divisionCode)
      : normalizeDivision(body.divisionCode)

    if (!isAdminRole(role)) {
      return badRequest('Role harus superadmin, editor, atau viewer.')
    }

    const account = await getAdminAuth().getUser(uid)

    await applyAssignment({
      active,
      displayName: typeof current.displayName === 'string' ? current.displayName : account.displayName || null,
      divisionCode,
      email: account.email || (typeof current.email === 'string' ? current.email : ''),
      isNew: !snapshot.exists,
      role,
      uid,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui akun admin.' },
      { status: 500 },
    )
  }
}
