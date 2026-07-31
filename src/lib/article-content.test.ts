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

  it('keeps allowed embeds and forces the hardened iframe attributes', () => {
    const result = sanitizeArticleContent(
      '<figure class="article-embed" data-provider="youtube" data-aspect="video"><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Dokumentasi"></iframe><figcaption>Dokumentasi Mubes</figcaption></figure>',
    )

    expect(result).toContain('data-provider="youtube"')
    expect(result).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"')
    expect(result).toContain('sandbox=')
    expect(result).toContain('referrerpolicy="strict-origin-when-cross-origin"')
    expect(result).toContain('<figcaption>Dokumentasi Mubes</figcaption>')
  })

  it('drops iframes from hosts outside the embed allowlist', () => {
    const result = sanitizeArticleContent(
      '<p>Isi</p><iframe src="https://evil.example.com/panel"></iframe><figure data-provider="youtube"><iframe src="https://www.youtube.com/embed/x"></iframe></figure>',
    )

    expect(result).not.toContain('evil.example.com')
    expect(result).not.toContain('www.youtube.com/embed')
    expect(result).toContain('<p>Isi</p>')
  })

  it('strips attributes an iframe should never carry', () => {
    const result = sanitizeArticleContent(
      '<iframe src="https://www.youtube-nocookie.com/embed/abc" srcdoc="<script>alert(1)</script>" onload="alert(1)" name="target"></iframe>',
    )

    expect(result).toContain('https://www.youtube-nocookie.com/embed/abc')
    expect(result).not.toContain('srcdoc')
    expect(result).not.toContain('onload')
    expect(result).not.toContain('name=')
  })

  it('normalizes image display attributes to the supported values', () => {
    const result = sanitizeArticleContent(
      '<img src="https://ik.imagekit.io/hmte/foto.webp" alt="Foto" data-size="1600px" data-align="justify">',
    )

    expect(result).toContain('data-size="full"')
    expect(result).toContain('data-align="center"')
    expect(result).toContain('loading="lazy"')
  })

  it('keeps chosen image sizes', () => {
    const result = sanitizeArticleContent(
      '<img src="https://ik.imagekit.io/hmte/foto.webp" alt="Foto" data-size="small" data-align="right">',
    )

    expect(result).toContain('data-size="small"')
    expect(result).toContain('data-align="right"')
  })

  it('converts legacy plain text into safe paragraphs', () => {
    const result = sanitizeArticleContent('Paragraf pertama.\n\n<script>teks</script>')

    expect(result).toBe('<p>Paragraf pertama.</p><p>&lt;script&gt;teks&lt;/script&gt;</p>')
  })
})
