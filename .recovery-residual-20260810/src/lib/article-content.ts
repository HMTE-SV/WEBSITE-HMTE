import sanitizeHtml from 'sanitize-html'
import { isAllowedEmbedSrc, normalizeEmbedAspect, normalizeEmbedProvider } from '@/lib/article-embed'
import {
  isAllowedArticleImage,
  normalizeArticleImageAlignment,
  normalizeArticleImageSize,
} from '@/lib/article-media'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeLegacyContent(content: string) {
  if (/<(?:p|h2|h3|strong|em|u|s|blockquote|ul|ol|li|a|code|pre|hr|br|img|figure|iframe)\b/i.test(content)) {
    return content
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replaceAll('\n', '<br>')}</p>`)
    .join('')
}

/*
 * Izin iframe di isi berita adalah satu-satunya tempat di situs ini yang
 * menjalankan kode pihak ketiga di dalam halaman kita. Jadi pagarnya berlapis:
 *
 * 1. src wajib cocok dengan daftar di article-embed.ts. Bukan sekadar "host
 *    Google", tapi bentuk path embed yang persis.
 * 2. sandbox dipasang paksa di sini, bukan diwarisi dari isi tersimpan. Isi di
 *    Firestore diperlakukan sebagai masukan yang tidak dipercaya, termasuk isi
 *    yang dulu ditulis lewat editor kita sendiri.
 * 3. Semua atribut lain dibuang, jadi tidak ada onload, srcdoc, atau name.
 */
const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation'
const EMBED_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'

export function sanitizeArticleContent(content: string) {
  return sanitizeHtml(normalizeLegacyContent(content), {
    allowedTags: [
      'p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'blockquote', 'ul', 'ol', 'li',
      'a', 'code', 'pre', 'hr', 'br', 'img', 'figure', 'figcaption', 'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'loading', 'data-size', 'data-align'],
      figure: ['class', 'data-provider', 'data-aspect'],
      iframe: ['src', 'title', 'loading', 'referrerpolicy', 'sandbox', 'allow', 'allowfullscreen'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    exclusiveFilter(frame) {
      if (frame.tag === 'img') {
        return !isAllowedArticleImage(frame.attribs.src)
      }

      if (frame.tag === 'iframe') {
        return !isAllowedEmbedSrc(frame.attribs.src)
      }

      return false
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
      /*
       * Ukuran dan perataan gambar disaring ke tiga nilai yang punya aturan CSS.
       * Nilai lain -- termasuk lebar piksel dari isi tempelan -- jatuh kembali ke
       * 'full', bukan diteruskan mentah ke atribut.
       */
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: 'lazy',
          'data-size': normalizeArticleImageSize(attribs['data-size']),
          'data-align': normalizeArticleImageAlignment(attribs['data-align']),
        },
      }),
      figure: (tagName, attribs) => {
        const provider = normalizeEmbedProvider(attribs['data-provider'])
        const embedAttribs: Record<string, string> = provider
          ? {
              class: 'article-embed',
              'data-provider': provider,
              'data-aspect': normalizeEmbedAspect(attribs['data-aspect']),
            }
          : { class: 'article-figure' }

        return { tagName, attribs: embedAttribs }
      },
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: attribs.src,
          title: attribs.title || 'Konten sisipan',
          loading: 'lazy',
          referrerpolicy: 'strict-origin-when-cross-origin',
          sandbox: EMBED_SANDBOX,
          allow: EMBED_ALLOW,
          allowfullscreen: 'true',
        },
      }),
    },
  })
}

export function getArticlePlainText(content: string) {
  return sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }).trim()
}
