import { slugify } from '@/lib/slug'

/*
 * Unggah langsung dari browser ke ImageKit.
 *
 * Berkasnya tidak melewati server kita sama sekali. Yang diminta dari server
 * hanya tanda tangan berumur pendek, lalu browser mengirim berkasnya sendiri ke
 * ImageKit. Ini yang membuat unggahan tetap mungkin di Firebase paket Spark,
 * yang tidak punya Storage, dan sekaligus menjaga fungsi serverless kita tidak
 * pernah menyentuh payload besar.
 */

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export type ImageKitFolder = 'pengurus' | 'berita' | 'galeri'

type ImageKitAuthResponse = {
  token: string
  expire: number
  signature: string
  publicKey: string
}

/**
 * Menyusun nama berkas yang aman dan bisa ditebak.
 *
 * Nama asli dari komputer pengurus sering mengandung spasi, tanda kurung, dan
 * huruf non-ASCII yang berubah jadi persen-encoding di URL dan menyulitkan saat
 * seseorang harus mencari berkasnya lagi di dasbor ImageKit. Stempel waktu
 * dipasang di depan supaya dua orang yang mengunggah "foto.jpg" tidak saling
 * menimpa.
 */
export function buildUploadFileName(originalName: string, now: Date = new Date()): string {
  const lastDot = originalName.lastIndexOf('.')
  const base = lastDot > 0 ? originalName.slice(0, lastDot) : originalName
  const rawExtension = lastDot > 0 ? originalName.slice(lastDot + 1).toLowerCase() : 'jpg'
  const extension = /^[a-z0-9]+$/.test(rawExtension) ? rawExtension : 'jpg'
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  const name = slugify(base) || 'gambar'

  return `${stamp}-${name}.${extension}`
}

export async function uploadImageToImageKit(
  file: File,
  folder: ImageKitFolder,
  getIdToken: () => Promise<string>,
): Promise<string> {
  const idToken = await getIdToken()

  const authResponse = await fetch('/api/imagekit-auth', {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}` },
  })

  if (!authResponse.ok) {
    const body = (await authResponse.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || 'Gagal meminta izin unggah dari server.')
  }

  const auth = (await authResponse.json()) as ImageKitAuthResponse

  const form = new FormData()
  form.append('file', file)
  form.append('fileName', buildUploadFileName(file.name))
  form.append('folder', `/hmte/${folder}`)
  form.append('publicKey', auth.publicKey)
  form.append('signature', auth.signature)
  form.append('expire', String(auth.expire))
  form.append('token', auth.token)
  // Nama yang bentrok diberi akhiran oleh ImageKit, bukan menimpa berkas lama.
  // Menimpa berarti gambar yang sudah terlanjur tayang di artikel lama ikut
  // berubah tanpa ada yang menyadarinya.
  form.append('useUniqueFileName', 'true')

  const uploadResponse = await fetch(IMAGEKIT_UPLOAD_URL, { method: 'POST', body: form })

  if (!uploadResponse.ok) {
    const body = (await uploadResponse.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message || 'ImageKit menolak unggahan ini.')
  }

  const result = (await uploadResponse.json()) as { url?: string }

  if (!result.url) {
    throw new Error('ImageKit tidak mengembalikan URL gambar.')
  }

  return result.url
}
