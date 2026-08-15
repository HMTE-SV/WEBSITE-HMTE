'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BlockNoteSchema,
  defaultBlockSpecs,
} from '@blocknote/core'
import { en } from '@blocknote/core/locales'
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react'
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core/extensions'
import { BlockNoteView } from '@blocknote/mantine'
import { registerUploadedMedia } from '@/lib/admin/media-library'
import { uploadImageToImageKit } from '@/lib/admin/imagekit-upload'
import { validateGalleryImage } from '@/lib/admin/media-validation'
import {
  EMBED_PROVIDER_LABELS,
  isAllowedEmbedSrc,
  resolveEmbed,
  type EmbedAspect,
  type EmbedProvider,
} from '@/lib/article-embed'
import { getFirebaseAuth } from '@/lib/firebase/client'

type AdminBlockEditorProps = {
  onChange: (html: string) => void
  value: string
}

const embedBlock = createReactBlockSpec(
  {
    type: 'hmteEmbed',
    propSchema: {
      src: { default: '' },
      provider: {
        default: 'youtube',
        values: Object.keys(EMBED_PROVIDER_LABELS) as EmbedProvider[],
      },
      aspect: {
        default: 'video',
        values: ['video', 'document', 'audio', 'map'] as EmbedAspect[],
      },
      title: { default: 'Konten sisipan' },
    },
    content: 'none',
  },
  {
    render: function EmbedBlockEditor({ block, editor }) {
      const [url, setUrl] = useState(block.props.src)
      const [message, setMessage] = useState('')
      const providerLabel = EMBED_PROVIDER_LABELS[block.props.provider]

      function applyUrl() {
        const resolved = resolveEmbed(url)

        if (!resolved) {
          setMessage('Tautan belum didukung. Gunakan YouTube, Vimeo, Google Drive/Docs/Form/Maps/Calendar, atau Spotify.')
          return
        }

        editor.updateBlock(block, {
          props: {
            src: resolved.src,
            provider: resolved.provider,
            aspect: resolved.aspect,
            title: `${resolved.providerLabel}: konten sisipan`,
          },
        })
        setUrl(resolved.src)
        setMessage('')
      }

      return (
        <div className="adp-block-embed" data-aspect={block.props.aspect} contentEditable={false}>
          <div className="adp-block-embed-head">
            <div>
              <strong>{block.props.src ? providerLabel : 'Sisipkan konten'}</strong>
              <small>Tempel tautan berbagi; editor akan mengubahnya menjadi iframe aman.</small>
            </div>
            {block.props.src ? <span>Iframe</span> : null}
          </div>
          {block.props.src && isAllowedEmbedSrc(block.props.src) ? (
            <div className="adp-block-embed-preview">
              <iframe src={block.props.src} title={block.props.title} loading="lazy" />
            </div>
          ) : null}
          <div className="adp-block-embed-controls">
            <input
              aria-label="Tautan konten sisipan"
              value={url}
              placeholder="https://youtu.be/... atau tautan Google Drive"
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyUrl()
                }
              }}
            />
            <button type="button" onClick={applyUrl}>Tampilkan</button>
          </div>
          {message ? <p role="alert">{message}</p> : null}
        </div>
      )
    },
    parse: (element) => {
      if (element.tagName !== 'FIGURE') return undefined
      const iframe = element.querySelector('iframe')
      const resolved = resolveEmbed(iframe?.getAttribute('src') || '')
      if (!resolved) return undefined

      return {
        src: resolved.src,
        provider: resolved.provider,
        aspect: resolved.aspect,
        title: iframe?.getAttribute('title') || `${resolved.providerLabel}: konten sisipan`,
      }
    },
    toExternalHTML: ({ block }) => {
      if (!isAllowedEmbedSrc(block.props.src)) return <p>Konten sisipan belum diatur.</p>

      return (
        <figure
          className="article-embed"
          data-provider={block.props.provider}
          data-aspect={block.props.aspect}
        >
          <iframe
            src={block.props.src}
            title={block.props.title}
            loading="lazy"
            allowFullScreen
          />
        </figure>
      )
    },
  },
)

const editorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    hmteEmbed: embedBlock(),
  },
})

const editorDictionary = {
  ...en,
  placeholders: {
    ...en.placeholders,
    default: "Mulai menulis atau ketik '/' untuk memilih blok",
    heading: 'Judul bagian',
    bulletListItem: 'Daftar',
    numberedListItem: 'Daftar',
    checkListItem: 'Daftar tugas',
  },
  side_menu: {
    add_block_label: 'Tambah blok',
    drag_handle_label: 'Buka menu blok',
  },
  file_blocks: {
    add_button_text: {
      image: 'Tambah gambar',
      video: 'Tambah video',
      audio: 'Tambah audio',
      file: 'Tambah berkas',
    },
  },
  slash_menu: {
    ...en.slash_menu,
    paragraph: { ...en.slash_menu.paragraph, title: 'Paragraf', subtext: 'Teks isi dokumen', group: 'Dasar' },
    heading: { ...en.slash_menu.heading, title: 'Judul 1', subtext: 'Judul utama tulisan', group: 'Judul' },
    heading_2: { ...en.slash_menu.heading_2, title: 'Judul 2', subtext: 'Judul bagian', group: 'Judul' },
    heading_3: { ...en.slash_menu.heading_3, title: 'Judul 3', subtext: 'Judul subbagian', group: 'Judul' },
    bullet_list: { ...en.slash_menu.bullet_list, title: 'Daftar poin', subtext: 'Daftar tanpa nomor', group: 'Dasar' },
    numbered_list: { ...en.slash_menu.numbered_list, title: 'Daftar bernomor', subtext: 'Daftar berurutan', group: 'Dasar' },
    check_list: { ...en.slash_menu.check_list, title: 'Daftar tugas', subtext: 'Daftar dengan kotak centang', group: 'Dasar' },
    quote: { ...en.slash_menu.quote, title: 'Kutipan', subtext: 'Kutipan atau sorotan teks', group: 'Dasar' },
    toggle_list: { ...en.slash_menu.toggle_list, title: 'Daftar lipat', subtext: 'Daftar dengan subitem yang dapat ditutup', group: 'Dasar' },
    code_block: { ...en.slash_menu.code_block, title: 'Blok kode', subtext: 'Kode dengan penyorotan sintaks', group: 'Dasar' },
    divider: { ...en.slash_menu.divider, title: 'Garis pemisah', subtext: 'Pisahkan dua bagian', group: 'Dasar' },
    table: { ...en.slash_menu.table, title: 'Tabel', subtext: 'Tabel dengan sel yang dapat diedit', group: 'Lanjutan' },
    image: { ...en.slash_menu.image, title: 'Gambar', subtext: 'Unggah atau tempel gambar', group: 'Media' },
    video: { ...en.slash_menu.video, title: 'Video', subtext: 'Unggah berkas video', group: 'Media' },
    audio: { ...en.slash_menu.audio, title: 'Audio', subtext: 'Unggah berkas audio', group: 'Media' },
    file: { ...en.slash_menu.file, title: 'Berkas', subtext: 'Unggah berkas untuk pembaca', group: 'Media' },
  },
}

export default function AdminBlockEditor({ onChange, value }: AdminBlockEditorProps) {
  const applyingExternalValue = useRef(false)
  const lastEmittedValue = useRef('')
  const [uploadError, setUploadError] = useState('')

  const editor = useCreateBlockNote({
    schema: editorSchema,
    dictionary: editorDictionary,
    uploadFile: async (file) => {
      const validation = validateGalleryImage(file)
      if (!validation.success) throw new Error(validation.errors.join(' '))

      setUploadError('')
      try {
        const upload = await uploadImageToImageKit(file, 'berita', async () => {
          const currentUser = getFirebaseAuth().currentUser
          if (!currentUser) throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
          return currentUser.getIdToken()
        })
        await registerUploadedMedia(upload, file, 'berita')
        return upload.url
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gambar gagal diunggah.'
        setUploadError(message)
        throw error
      }
    },
  })

  useEffect(() => {
    if (value === lastEmittedValue.current) return

    applyingExternalValue.current = true
    const blocks = editor.tryParseHTMLToBlocks(value.trim() || '<p></p>')
    editor.replaceBlocks(editor.document, blocks)
    queueMicrotask(() => {
      applyingExternalValue.current = false
    })
  }, [editor, value])

  return (
    <div className="adp-block-editor">
      <div className="adp-block-editor-guide">
        <span>Ketik <kbd>/</kbd> untuk menambah blok</span>
        <span>Seret ikon di kiri untuk menyusun ulang</span>
      </div>
      {uploadError ? <p className="adp-inline-error" role="alert">{uploadError}</p> : null}
      <BlockNoteView
        editor={editor}
        theme="light"
        slashMenu={false}
        onChange={() => {
          if (applyingExternalValue.current) return
          const html = editor.blocksToHTMLLossy(editor.document)
          lastEmittedValue.current = html
          onChange(html)
        }}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: 'Iframe / Embed',
                  subtext: 'YouTube, Drive, Docs, Form, Maps, Calendar, Vimeo, atau Spotify',
                  aliases: ['iframe', 'embed', 'video', 'google', 'spotify'],
                  group: 'Sisipan pihak ketiga',
                  icon: <span aria-hidden="true">↗</span>,
                  onItemClick: () => {
                    insertOrUpdateBlockForSlashMenu(editor, { type: 'hmteEmbed' })
                  },
                },
              ],
              query,
            )
          }
        />
      </BlockNoteView>
    </div>
  )
}
