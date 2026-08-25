import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import path from 'node:path'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ARCHIVE_COOKIE_NAME, readUnlockedProjectIds } from '@/lib/archive-access'
import { findPrivateDocument, statPrivateDocument } from '@/lib/downloads-data'

/*
 * Satu-satunya pintu keluar berkas arsip privat.
 *
 * Berkasnya sendiri tinggal di private/arsip/, di luar public/, jadi tidak ada
 * URL statis yang bisa ditebak — kalau rute ini menolak, tidak ada jalan lain.
 * Tautan eksternal pun diteruskan dari sini, bukan diberikan alamat aslinya:
 * alamat yang sudah sampai ke tangan orang tidak bisa dicabut lagi, sedangkan
 * gerbang ini bisa.
 *
 * Yang menentukan boleh atau tidak adalah kuki bertanda tangan, bukan parameter
 * di alamat. Menebak id project dan id dokumen tidak membuka apa pun.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const contentTypes: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  csv: 'text/csv',
  txt: 'text/plain; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

function contentTypeFor(filePath: string): string {
  const extension = path.extname(filePath).replace('.', '').toLowerCase()
  return contentTypes[extension] || 'application/octet-stream'
}

/** Nama unduhan yang ramah dibaca, tanpa karakter yang bisa merusak header. */
function downloadName(title: string, filePath: string): string {
  const extension = path.extname(filePath) || ''
  const base = title.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 120) || 'dokumen-arsip'
  return base.toLowerCase().endsWith(extension.toLowerCase()) ? base : `${base}${extension}`
}

function guarded(response: NextResponse | Response): Response {
  response.headers.set('cache-control', 'private, no-store, max-age=0')
  response.headers.set('x-robots-tag', 'noindex, nofollow')
  return response
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; documentId: string }> },
) {
  const { projectId, documentId } = await params
  const unlocked = await readUnlockedProjectIds((await cookies()).get(ARCHIVE_COOKIE_NAME)?.value)

  /*
   * Satu jawaban untuk dua keadaan yang berbeda: belum berhak, dan dokumennya
   * memang tidak ada. Membedakannya berarti memberi tahu penebak bahwa ia
   * menemukan sesuatu — pesan yang sama membuat penelusuran itu sia-sia.
   */
  const denied = () => guarded(NextResponse.json({ error: 'Dokumen tidak tersedia.' }, { status: 404 }))

  if (!unlocked.includes(projectId)) return denied()

  const found = await findPrivateDocument(projectId, documentId)
  if (!found) return denied()

  const { document } = found

  if (document.kind === 'external') {
    if (!document.externalUrl.startsWith('https://')) return denied()

    const upstream = await fetch(document.externalUrl, { cache: 'no-store', redirect: 'follow' }).catch(() => null)
    if (!upstream || !upstream.ok || !upstream.body) {
      return guarded(NextResponse.json({ error: 'Sumber dokumen sedang tidak dapat dijangkau.' }, { status: 502 }))
    }

    return guarded(new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'content-disposition': `inline; filename="${downloadName(document.title, document.format ? `.${document.format.toLowerCase()}` : '')}"`,
      },
    }))
  }

  const stats = await statPrivateDocument(document)
  if (!stats) return denied()

  const stream = Readable.toWeb(createReadStream(stats.absolutePath)) as ReadableStream<Uint8Array>

  return guarded(new Response(stream, {
    status: 200,
    headers: {
      'content-type': contentTypeFor(stats.absolutePath),
      'content-length': String(stats.size),
      'content-disposition': `attachment; filename="${downloadName(document.title, stats.absolutePath)}"`,
    },
  }))
}
