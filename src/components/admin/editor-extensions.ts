import { Node } from '@tiptap/core'
import type { DOMOutputSpec } from '@tiptap/pm/model'
import ImageExtension from '@tiptap/extension-image'
import {
  normalizeEmbedAspect,
  normalizeEmbedProvider,
  type EmbedAspect,
  type EmbedProvider,
} from '@/lib/article-embed'
import { normalizeArticleImageAlignment, normalizeArticleImageSize } from '@/lib/article-media'

/*
 * Ekstensi Tiptap khusus panel ini.
 *
 * Keduanya sengaja menghasilkan HTML yang persis sama dengan yang diizinkan
 * sanitizeArticleContent(). Apa pun yang tampil di editor harus tampil juga di
 * halaman publik; sisipan yang hidup di editor lalu hilang saat terbit adalah
 * bentuk kegagalan yang paling sulit dilacak penulis.
 */

export type ArticleEmbedAttributes = {
  aspect: EmbedAspect
  caption: string
  provider: EmbedProvider | ''
  src: string
  title: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleEmbed: {
      setArticleEmbed: (options: Partial<ArticleEmbedAttributes> & { src: string }) => ReturnType
    }
  }
}

export const ArticleEmbed = Node.create({
  name: 'articleEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.querySelector('iframe')?.getAttribute('src') ?? '',
      },
      provider: {
        default: '',
        parseHTML: (element) => normalizeEmbedProvider(element.getAttribute('data-provider') ?? ''),
      },
      aspect: {
        default: 'video',
        parseHTML: (element) => normalizeEmbedAspect(element.getAttribute('data-aspect') ?? ''),
      },
      title: {
        default: '',
        parseHTML: (element) => element.querySelector('iframe')?.getAttribute('title') ?? '',
      },
      caption: {
        default: '',
        parseHTML: (element) => element.querySelector('figcaption')?.textContent ?? '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-provider]',
        // Tanpa iframe, figure itu bukan sisipan kita. Biarkan aturan lain yang
        // menanganinya daripada memasang node kosong yang tak bisa dihapus.
        getAttrs: (element) => (element.querySelector('iframe[src]') ? null : false),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attributes = HTMLAttributes as Record<string, string>
    const caption = (attributes.caption ?? '').trim()
    const figureAttributes = {
      class: 'article-embed',
      'data-provider': normalizeEmbedProvider(attributes.provider),
      'data-aspect': normalizeEmbedAspect(attributes.aspect),
    }
    const iframe: DOMOutputSpec = [
      'iframe',
      {
        src: attributes.src,
        title: attributes.title || 'Konten sisipan',
        loading: 'lazy',
        allowfullscreen: 'true',
      },
    ]

    return (
      caption
        ? ['figure', figureAttributes, iframe, ['figcaption', {}, caption]]
        : ['figure', figureAttributes, iframe]
    ) as DOMOutputSpec
  },

  addCommands() {
    return {
      setArticleEmbed:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              aspect: normalizeEmbedAspect(options.aspect),
              caption: options.caption ?? '',
              provider: normalizeEmbedProvider(options.provider ?? ''),
              src: options.src,
              title: options.title ?? '',
            },
          }),
    }
  },
})

/*
 * Gambar dengan ukuran tampil.
 *
 * Yang disimpan bukan lebar piksel melainkan salah satu dari tiga peran
 * (penuh, sedang, kecil). Lebar piksel yang diketik penulis selalu salah di
 * salah satu ukuran layar, dan gambar hasil unggah 2000px yang dipasang apa
 * adanya adalah keluhan yang membuat kontrol ini ada.
 */
export const ArticleImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: 'full',
        parseHTML: (element) => normalizeArticleImageSize(element.getAttribute('data-size')),
        renderHTML: (attributes) => ({ 'data-size': normalizeArticleImageSize(attributes.size as string) }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => normalizeArticleImageAlignment(element.getAttribute('data-align')),
        renderHTML: (attributes) => ({ 'data-align': normalizeArticleImageAlignment(attributes.align as string) }),
      },
    }
  },
})
