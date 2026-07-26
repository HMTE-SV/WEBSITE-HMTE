import { describe, expect, it } from 'vitest'
import { sanitizeArticleContent } from './article-content'

describe('article content sanitizer', () => {
  it('keeps supported editorial markup and ImageKit images', () => {
    const result = sanitizeArticleContent(
      '<h2>Judul</h2><p>Isi <strong>penting</strong>.</p><img src="https://ik.imagekit.io/hmte/foto.webp" alt="Foto">',
    )

    expect(result).toContain('<h2>Judul</h2>')
    expect(result).toContain('<strong>penting</strong>')
    expect(result).toContain('https://ik.imagekit.io/hmte/foto.webp')
  })

  it('removes scripts, event handlers, and unrelated image hosts', () => {
    const result = sanitizeArticleContent(
      '<p onclick="alert(1)">Aman</p><script>alert(1)</script><img src="https://example.com/tracker.png">',
    )

    expect(result).toBe('<p>Aman</p>')
  })

  it('converts legacy plain text into safe paragraphs', () => {
    const result = sanitizeArticleContent('Paragraf pertama.\n\n<script>teks</script>')

    expect(result).toBe('<p>Paragraf pertama.</p><p>&lt;script&gt;teks&lt;/script&gt;</p>')
  })
})
