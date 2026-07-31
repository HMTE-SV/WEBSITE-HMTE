/*
 * Aturan gambar di dalam isi berita.
 *
 * Dipisah dari article-content.ts karena editor (komponen klien) perlu memakai
 * aturan yang sama untuk memberi peringatan lebih awal, sementara
 * article-content.ts mengimpor sanitize-html yang tidak perlu ikut ke bundel
 * browser. Isi berkas ini harus tetap murni.
 */

export const ARTICLE_IMAGE_HOSTS = ['ik.imagekit.io', 'firebasestorage.googleapis.com']

export function isAllowedArticleImage(source: string | undefined): boolean {
  if (!source) return false

  try {
    const url = new URL(source)
    return url.protocol === 'https:' && ARTICLE_IMAGE_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

/*
 * Ukuran tampil gambar.
 *
 * Tiga pilihan, bukan angka bebas. Lebar dalam piksel yang diketik penulis
 * selalu salah di salah satu ukuran layar, dan gambar 1600px yang ditempel apa
 * adanya adalah keluhan yang membuat kontrol ini ada.
 */
export const ARTICLE_IMAGE_SIZES = ['full', 'medium', 'small'] as const
export const ARTICLE_IMAGE_ALIGNMENTS = ['center', 'left', 'right'] as const

export type ArticleImageSize = (typeof ARTICLE_IMAGE_SIZES)[number]
export type ArticleImageAlignment = (typeof ARTICLE_IMAGE_ALIGNMENTS)[number]

export const ARTICLE_IMAGE_SIZE_LABELS: Record<ArticleImageSize, string> = {
  full: 'Penuh',
  medium: 'Sedang',
  small: 'Kecil',
}

export const ARTICLE_IMAGE_ALIGNMENT_LABELS: Record<ArticleImageAlignment, string> = {
  center: 'Tengah',
  left: 'Kiri',
  right: 'Kanan',
}

export function normalizeArticleImageSize(value: string | undefined | null): ArticleImageSize {
  return ARTICLE_IMAGE_SIZES.includes(value as ArticleImageSize) ? (value as ArticleImageSize) : 'full'
}

export function normalizeArticleImageAlignment(value: string | undefined | null): ArticleImageAlignment {
  return ARTICLE_IMAGE_ALIGNMENTS.includes(value as ArticleImageAlignment)
    ? (value as ArticleImageAlignment)
    : 'center'
}
