import sanitizeHtml from 'sanitize-html'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeLegacyContent(content: string) {
  if (/<(?:p|h2|h3|strong|em|u|s|blockquote|ul|ol|li|a|code|pre|hr|br|img)\b/i.test(content)) {
    return content
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replaceAll('\n', '<br>')}</p>`)
    .join('')
}

function isAllowedArticleImage(source: string | undefined) {
  if (!source) return false

  try {
    const url = new URL(source)
    return url.protocol === 'https:' && ['ik.imagekit.io', 'firebasestorage.googleapis.com'].includes(url.hostname)
  } catch {
    return false
  }
}

export function sanitizeArticleContent(content: string) {
  return sanitizeHtml(normalizeLegacyContent(content), {
    allowedTags: [
      'p', 'h2', 'h3', 'strong', 'em', 'u', 's', 'blockquote', 'ul', 'ol', 'li',
      'a', 'code', 'pre', 'hr', 'br', 'img',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    exclusiveFilter(frame) {
      return frame.tag === 'img' && !isAllowedArticleImage(frame.attribs.src)
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer', target: '_blank' },
      }),
    },
  })
}

export function getArticlePlainText(content: string) {
  return sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} }).trim()
}
