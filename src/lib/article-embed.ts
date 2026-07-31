/*
 * Sisipan pihak ketiga (video, dokumen, peta, audio) untuk isi berita.
 *
 * Satu berkas ini memegang dua peran yang harus tidak boleh berbeda:
 *
 * 1. resolveEmbed() dipakai panel editor untuk mengubah URL yang ditempel
 *    pengurus menjadi URL embed yang benar.
 * 2. isAllowedEmbedSrc() dipakai sanitizeArticleContent() untuk memutuskan
 *    iframe mana yang boleh tampil di halaman publik.
 *
 * Kalau keduanya tinggal di berkas berbeda, cepat atau lambat editor akan
 * memasang sesuatu yang diam-diam dibuang saat terbit -- kegagalan paling
 * membingungkan untuk penulis, karena tidak ada pesan error di mana pun.
 *
 * Karena itu berkas ini wajib murni: tanpa Firebase, tanpa sanitize-html,
 * tanpa DOM. Sisi server dan sisi klien mengimpor yang sama persis.
 */

export type EmbedAspect = 'video' | 'document' | 'audio' | 'map'

export type ResolvedEmbed = {
  aspect: EmbedAspect
  provider: EmbedProvider
  providerLabel: string
  src: string
}

export type EmbedProvider =
  | 'youtube'
  | 'vimeo'
  | 'google-drive'
  | 'google-docs'
  | 'google-form'
  | 'google-maps'
  | 'google-calendar'
  | 'spotify'

export const EMBED_PROVIDER_LABELS: Record<EmbedProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  'google-drive': 'Google Drive',
  'google-docs': 'Google Docs',
  'google-form': 'Google Form',
  'google-maps': 'Google Maps',
  'google-calendar': 'Google Calendar',
  spotify: 'Spotify',
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
])

const ID_PATTERN = /^[\w-]+$/

function parseUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return null

  // Pengurus jauh lebih sering menempel "youtu.be/xxxx" daripada bentuk
  // lengkapnya. Tanpa skema, URL akan diperlakukan sebagai path relatif.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    return url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function segmentsOf(url: URL) {
  return url.pathname.split('/').filter(Boolean)
}

function resolveYoutube(url: URL): ResolvedEmbed | null {
  const segments = segmentsOf(url)
  const host = url.hostname.toLowerCase()

  const videoId =
    host === 'youtu.be' || host === 'www.youtu.be'
      ? segments[0]
      : segments[0] === 'watch'
        ? url.searchParams.get('v')
        : ['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')
          ? segments[1]
          : url.searchParams.get('v')

  if (!videoId || !ID_PATTERN.test(videoId)) {
    return null
  }

  // youtube-nocookie menunda cookie pelacak sampai penonton benar-benar memutar
  // videonya. Untuk situs organisasi kampus, itu default yang benar.
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`)
  const startSeconds = parseTimeParameter(url.searchParams.get('t') ?? url.searchParams.get('start'))

  if (startSeconds) {
    embed.searchParams.set('start', String(startSeconds))
  }

  const listId = url.searchParams.get('list')

  if (listId && ID_PATTERN.test(listId)) {
    embed.searchParams.set('list', listId)
  }

  return { aspect: 'video', provider: 'youtube', providerLabel: 'YouTube', src: embed.toString() }
}

/** Menerima "90", "1m30s", atau "2h3m4s" -- semuanya bentuk sah tautan YouTube. */
function parseTimeParameter(value: string | null) {
  if (!value) return 0

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value)

  if (!match || !match.slice(1).some(Boolean)) {
    return 0
  }

  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function resolveVimeo(url: URL): ResolvedEmbed | null {
  const segments = segmentsOf(url)
  const videoId = url.hostname.toLowerCase() === 'player.vimeo.com' ? segments[1] : segments[0]

  if (!videoId || !/^\d+$/.test(videoId)) {
    return null
  }

  return {
    aspect: 'video',
    provider: 'vimeo',
    providerLabel: 'Vimeo',
    src: `https://player.vimeo.com/video/${videoId}`,
  }
}

function resolveGoogleDrive(url: URL): ResolvedEmbed | null {
  const segments = segmentsOf(url)
  const fileId = segments[0] === 'file' && segments[1] === 'd' ? segments[2] : url.searchParams.get('id')

  if (!fileId || !ID_PATTERN.test(fileId)) {
    return null
  }

  return {
    aspect: 'document',
    provider: 'google-drive',
    providerLabel: 'Google Drive',
    src: `https://drive.google.com/file/d/${fileId}/preview`,
  }
}

const GOOGLE_DOCS_KINDS: Record<string, 'preview' | 'embed'> = {
  document: 'preview',
  spreadsheets: 'preview',
  presentation: 'embed',
}

function resolveGoogleDocs(url: URL): ResolvedEmbed | null {
  const segments = segmentsOf(url)
  const kind = segments[0] ?? ''

  if (kind === 'forms') {
    // Form publik memakai path /forms/d/e/{id}/viewform.
    const formId = segments[1] === 'd' && segments[2] === 'e' ? segments[3] : segments[2]

    if (!formId || !ID_PATTERN.test(formId)) {
      return null
    }

    return {
      aspect: 'document',
      provider: 'google-form',
      providerLabel: 'Google Form',
      src: `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true`,
    }
  }

  const suffix = GOOGLE_DOCS_KINDS[kind]
  const documentId = segments[1] === 'd' ? segments[2] : ''

  if (!suffix || !documentId || !ID_PATTERN.test(documentId)) {
    return null
  }

  return {
    aspect: 'document',
    provider: 'google-docs',
    providerLabel: 'Google Docs',
    src: `https://docs.google.com/${kind}/d/${documentId}/${suffix}`,
  }
}

function resolveSpotify(url: URL): ResolvedEmbed | null {
  const segments = segmentsOf(url).filter((segment) => !/^(intl|embed)(-[a-z]{2})?$/.test(segment))
  const [kind, id] = segments

  if (!kind || !id || !['track', 'album', 'playlist', 'episode', 'show'].includes(kind) || !ID_PATTERN.test(id)) {
    return null
  }

  return {
    aspect: 'audio',
    provider: 'spotify',
    providerLabel: 'Spotify',
    src: `https://open.spotify.com/embed/${kind}/${id}`,
  }
}

/**
 * Mengubah URL apa pun yang ditempel pengurus menjadi sisipan yang sah,
 * atau null kalau layanannya belum didukung.
 */
export function resolveEmbed(value: string): ResolvedEmbed | null {
  const url = parseUrl(value)

  if (!url) return null

  const host = url.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(host)) {
    return resolveYoutube(url)
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    return resolveVimeo(url)
  }

  if (host === 'drive.google.com') {
    return resolveGoogleDrive(url)
  }

  if (host === 'docs.google.com') {
    return resolveGoogleDocs(url)
  }

  if (host === 'open.spotify.com') {
    return resolveSpotify(url)
  }

  if (host === 'calendar.google.com' && url.pathname.startsWith('/calendar/embed')) {
    return {
      aspect: 'document',
      provider: 'google-calendar',
      providerLabel: 'Google Calendar',
      src: url.toString(),
    }
  }

  /*
   * Google Maps hanya diterima dalam bentuk yang sudah embed. Mengubah tautan
   * berbagi biasa menjadi embed butuh API key, dan menebaknya menghasilkan peta
   * kosong yang tampak seperti bug situs.
   */
  if ((host === 'www.google.com' || host === 'google.com') && url.pathname.startsWith('/maps/embed')) {
    return { aspect: 'map', provider: 'google-maps', providerLabel: 'Google Maps', src: url.toString() }
  }

  return null
}

/*
 * Daftar bentuk src iframe yang boleh lolos ke halaman publik.
 *
 * Ini pemeriksaan terakhir, bukan pertama: apa pun yang tersimpan di Firestore
 * -- termasuk isi lama, isi hasil tempel, atau isi yang diubah lewat jalur lain
 * -- harus lewat sini sebelum jadi iframe di browser pembaca.
 */
const ALLOWED_EMBED_PATTERNS: Array<{ host: string; path: RegExp }> = [
  { host: 'www.youtube-nocookie.com', path: /^\/embed\/[\w-]+$/ },
  { host: 'player.vimeo.com', path: /^\/video\/\d+$/ },
  { host: 'drive.google.com', path: /^\/file\/d\/[\w-]+\/preview$/ },
  { host: 'docs.google.com', path: /^\/(?:document|spreadsheets)\/d\/[\w-]+\/preview$/ },
  { host: 'docs.google.com', path: /^\/presentation\/d\/[\w-]+\/embed$/ },
  { host: 'docs.google.com', path: /^\/forms\/d\/e\/[\w-]+\/viewform$/ },
  { host: 'open.spotify.com', path: /^\/embed\/(?:track|album|playlist|episode|show)\/[\w-]+$/ },
  { host: 'calendar.google.com', path: /^\/calendar\/embed$/ },
  { host: 'www.google.com', path: /^\/maps\/embed/ },
]

export function isAllowedEmbedSrc(value: string | undefined): boolean {
  if (!value) return false

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== 'https:') {
    return false
  }

  return ALLOWED_EMBED_PATTERNS.some(
    (pattern) => pattern.host === url.hostname.toLowerCase() && pattern.path.test(url.pathname),
  )
}

export const EMBED_ASPECTS: EmbedAspect[] = ['video', 'document', 'audio', 'map']

export function normalizeEmbedAspect(value: string | undefined): EmbedAspect {
  return EMBED_ASPECTS.includes(value as EmbedAspect) ? (value as EmbedAspect) : 'video'
}

export function normalizeEmbedProvider(value: string | undefined): EmbedProvider | '' {
  return value && value in EMBED_PROVIDER_LABELS ? (value as EmbedProvider) : ''
}
