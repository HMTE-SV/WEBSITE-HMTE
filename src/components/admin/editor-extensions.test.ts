// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { sanitizeArticleContent } from '@/lib/article-content'
import { ArticleEmbed, ArticleImage } from './editor-extensions'

/*
 * Tes jembatan.
 *
 * Yang dijaga di sini bukan Tiptap dan bukan sanitizer, melainkan sambungan di
 * antara keduanya: HTML yang dihasilkan editor harus selamat melewati
 * sanitizeArticleContent tanpa kehilangan apa pun yang dipasang penulis.
 * Kalau sambungan ini putus, gejalanya adalah sisipan yang tampak baik-baik
 * saja di panel lalu lenyap begitu berita terbit -- kegagalan yang tidak
 * memunculkan error di mana pun.
 */

function createEditor() {
  return new Editor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), ArticleImage, ArticleEmbed],
    content: '<p></p>',
  })
}

describe('editor output survives the publish sanitizer', () => {
  it('keeps an inserted embed intact end to end', () => {
    const editor = createEditor()

    editor.commands.setArticleEmbed({
      aspect: 'video',
      caption: 'Dokumentasi Mubes 2026',
      provider: 'youtube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      title: 'Dokumentasi Mubes 2026',
    })

    const editorHtml = editor.getHTML()
    const publishedHtml = sanitizeArticleContent(editorHtml)

    expect(editorHtml).toContain('data-provider="youtube"')
    expect(publishedHtml).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(publishedHtml).toContain('data-aspect="video"')
    expect(publishedHtml).toContain('Dokumentasi Mubes 2026')
    expect(publishedHtml).toContain('sandbox=')

    editor.destroy()
  })

  it('keeps the chosen image size end to end', () => {
    const editor = createEditor()

    editor.commands.setImage({ alt: 'Foto pelatihan', src: 'https://ik.imagekit.io/hmte/foto.webp' })
    editor.commands.selectAll()
    editor.commands.updateAttributes('image', { align: 'right', size: 'small' })

    const publishedHtml = sanitizeArticleContent(editor.getHTML())

    expect(publishedHtml).toContain('data-size="small"')
    expect(publishedHtml).toContain('data-align="right"')
    expect(publishedHtml).toContain('alt="Foto pelatihan"')

    editor.destroy()
  })

  it('reads saved articles back into the same nodes', () => {
    const saved =
      '<p>Pembuka.</p>' +
      '<figure class="article-embed" data-provider="vimeo" data-aspect="video">' +
      '<iframe src="https://player.vimeo.com/video/76979871" title="Rekaman"></iframe>' +
      '<figcaption>Rekaman penuh</figcaption></figure>' +
      '<img src="https://ik.imagekit.io/hmte/foto.webp" alt="Foto" data-size="medium" data-align="left">'

    const editor = createEditor()
    editor.commands.setContent(saved)

    const reopened = editor.getHTML()

    expect(reopened).toContain('https://player.vimeo.com/video/76979871')
    expect(reopened).toContain('data-provider="vimeo"')
    expect(reopened).toContain('Rekaman penuh')
    expect(reopened).toContain('data-size="medium"')
    expect(reopened).toContain('data-align="left"')

    editor.destroy()
  })
})
