'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { uploadImageToImageKit } from '@/lib/admin/imagekit-upload'
import { registerUploadedMedia } from '@/lib/admin/media-library'
import { validateArticleCoverImage, validateGalleryImageUrl } from '@/lib/admin/media-validation'
import { isAllowedEmbedSrc, resolveEmbed } from '@/lib/article-embed'
import {
  ARTICLE_IMAGE_ALIGNMENTS,
  ARTICLE_IMAGE_ALIGNMENT_LABELS,
  ARTICLE_IMAGE_SIZES,
  ARTICLE_IMAGE_SIZE_LABELS,
  isAllowedArticleImage,
} from '@/lib/article-media'
import { ArticleEmbed, ArticleImage } from './editor-extensions'

/*
 * Editor artikel.
 *
 * Dasarnya Tiptap. Yang ditambahkan di atasnya adalah hal-hal yang membuat
 * menulis berita di sini masuk akal dibanding menulis di tempat lain lalu
 * menempelkannya:
 *
 * 1. Tidak ada window.prompt. Tautan, gambar, dan sisipan punya panelnya
 *    masing-masing di dalam halaman, dan semuanya bisa dibatalkan.
 * 2. Gambar punya ukuran tampil. Foto hasil unggah 2000px yang dipasang apa
 *    adanya adalah alasan kontrol ini ada; yang disimpan peran tampilnya
 *    (penuh/sedang/kecil), bukan lebar piksel yang pasti salah di salah satu
 *    ukuran layar.
 * 3. Sisipan video, dokumen, peta, dan audio lewat satu kotak URL. Pengurus
 *    menempel tautan yang biasa mereka salin; article-embed.ts yang mengubahnya
 *    jadi URL embed yang benar.
 * 4. Ada pratinjau. Isi dirender memakai kelas .article-rich-content yang sama
 *    dengan halaman publik, jadi yang dilihat penulis adalah tata letak yang
 *    sebenarnya, bukan perkiraan.
 * 5. Ada peringatan terbit. Apa pun yang akan dibuang sanitizeArticleContent()
 *    -- gambar dari host lain, sisipan dari layanan tak didukung -- disebutkan
 *    sebelum tombol simpan ditekan, bukan hilang diam-diam setelahnya.
 *
 * Batasnya tetap sanitizeArticleContent di src/lib/article-content.ts. Tidak
 * ada tombol di sini yang menghasilkan markup di luar daftar itu.
 */

type AdminRichTextEditorProps = {
  onChange: (value: string) => void
  value: string
}

type ToolbarButtonProps = {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
  title: string
}

function ToolbarButton({ active = false, disabled = false, label, onClick, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={active}
      className={active ? 'is-active' : undefined}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  )
}

function escapeEditorText(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeEditorContent(value: string) {
  const content = value.trim()

  if (!content) {
    return '<p></p>'
  }

  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeEditorText(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('')
}

/**
 * Melengkapi URL yang diketik tanpa skema.
 *
 * Pengurus menempel "hmte.ugm.ac.id" jauh lebih sering daripada bentuk
 * lengkapnya, dan tautan tanpa skema diperlakukan browser sebagai path relatif:
 * hasilnya tautan ke halaman kita sendiri yang tidak ada.
 */
function normalizeLinkHref(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.includes(':') ? trimmed : `https://${trimmed}`
}

/*
 * Sama dengan hitungan waktu baca di halaman publik (src/lib/article-data.ts).
 * Angka yang berbeda antara panel dan situs untuk artikel yang sama adalah
 * bentuk paling kecil dan paling menjengkelkan dari data yang tidak sinkron.
 */
const WORDS_PER_MINUTE = 200

const EMBED_HINTS = [
  'YouTube: tempel tautan video, Shorts, atau live',
  'Vimeo: tautan video',
  'Google Drive: berkas yang izinnya sudah "siapa saja dengan tautan"',
  'Google Docs, Sheets, Slides, Form',
  'Google Maps: pakai menu Bagikan › Sematkan peta',
  'Spotify: lagu, album, playlist, atau episode',
]

type PanelMode = 'none' | 'link' | 'image' | 'embed'

export function AdminRichTextEditor({ onChange, value }: AdminRichTextEditorProps) {
  const [mediaError, setMediaError] = useState('')
  const [panel, setPanel] = useState<PanelMode>('none')
  const [linkDraft, setLinkDraft] = useState('')
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [imageAltDraft, setImageAltDraft] = useState('')
  const [embedUrlDraft, setEmbedUrlDraft] = useState('')
  const [embedCaptionDraft, setEmbedCaptionDraft] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'phone'>('desktop')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    content: normalizeEditorContent(value),
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: {
          autolink: true,
          defaultProtocol: 'https',
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      ArticleImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
      ArticleEmbed,
      Placeholder.configure({
        placeholder: 'Mulai tulis berita. Gunakan heading untuk membagi bagian agar mudah dibaca.',
      }),
    ],
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.isEmpty ? '' : currentEditor.getHTML())
    },
  })

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const text = currentEditor?.getText() ?? ''
      const words = text.trim() ? text.trim().split(/\s+/).length : 0

      /*
       * Peringatan terbit dihitung dari dokumen, bukan dari HTML hasil render,
       * supaya pemeriksaannya memakai predikat yang sama persis dengan
       * sanitizer -- bukan pencocokan string yang mirip-mirip.
       */
      const publishWarnings: string[] = []

      currentEditor?.state.doc.descendants((node) => {
        if (node.type.name === 'image' && !isAllowedArticleImage(String(node.attrs.src ?? ''))) {
          publishWarnings.push(
            'Ada gambar dari alamat di luar ImageKit. Gambar itu akan hilang saat berita terbit. Unggah ulang lewat tombol Gambar.',
          )
        }

        if (node.type.name === 'articleEmbed' && !isAllowedEmbedSrc(String(node.attrs.src ?? ''))) {
          publishWarnings.push('Ada sisipan dari layanan yang belum didukung. Sisipan itu akan hilang saat berita terbit.')
        }
      })

      return {
        characters: text.length,
        words,
        readMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
        publishWarnings: [...new Set(publishWarnings)],
        imageAlign: String(currentEditor?.getAttributes('image').align ?? 'center'),
        imageSize: String(currentEditor?.getAttributes('image').size ?? 'full'),
        isBlockquote: currentEditor?.isActive('blockquote') ?? false,
        isBold: currentEditor?.isActive('bold') ?? false,
        isBulletList: currentEditor?.isActive('bulletList') ?? false,
        isCodeBlock: currentEditor?.isActive('codeBlock') ?? false,
        isEmbed: currentEditor?.isActive('articleEmbed') ?? false,
        isHeading2: currentEditor?.isActive('heading', { level: 2 }) ?? false,
        isHeading3: currentEditor?.isActive('heading', { level: 3 }) ?? false,
        isImage: currentEditor?.isActive('image') ?? false,
        isItalic: currentEditor?.isActive('italic') ?? false,
        isLink: currentEditor?.isActive('link') ?? false,
        isOrderedList: currentEditor?.isActive('orderedList') ?? false,
        isParagraph: currentEditor?.isActive('paragraph') ?? false,
        isUnderline: currentEditor?.isActive('underline') ?? false,
      }
    },
  })

  const toolbarState = editorState ?? {
    characters: 0,
    words: 0,
    readMinutes: 1,
    publishWarnings: [] as string[],
    imageAlign: 'center',
    imageSize: 'full',
    isBlockquote: false,
    isBold: false,
    isBulletList: false,
    isCodeBlock: false,
    isEmbed: false,
    isHeading2: false,
    isHeading3: false,
    isImage: false,
    isItalic: false,
    isLink: false,
    isOrderedList: false,
    isParagraph: false,
    isUnderline: false,
  }

  // Ditinjau saat pengurus mengetik di kotak sisipan, jadi layanan yang dikenali
  // (atau tidak dikenali) terlihat sebelum tombol Sisipkan ditekan.
  const resolvedEmbed = useMemo(() => (embedUrlDraft.trim() ? resolveEmbed(embedUrlDraft) : null), [embedUrlDraft])

  useEffect(() => {
    if (!editor || editor.isFocused) {
      return
    }

    const nextContent = normalizeEditorContent(value)

    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false })
    }
  }, [editor, value])

  const openLinkPanel = useCallback(() => {
    if (!editor) return

    setMediaError('')
    setLinkDraft(String(editor.getAttributes('link').href || ''))
    setPanel('link')
  }, [editor])

  /*
   * Ctrl+K adalah pintasan tautan di hampir setiap editor teks, dan menulis
   * berita berarti menempel tautan berkali-kali. Dipasang di sini, bukan sebagai
   * ekstensi Tiptap, karena yang dibukanya panel React, bukan perintah editor.
   */
  useEffect(() => {
    if (!editor) return

    function handleKeydown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!editor?.isFocused) return
        event.preventDefault()
        openLinkPanel()
      }

      if (event.key === 'Escape') {
        setPanel('none')
        setIsFocusMode(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [editor, openLinkPanel])

  function applyLink() {
    if (!editor) return

    const href = normalizeLinkHref(linkDraft)

    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setPanel('none')
      return
    }

    if (!/^(https?:|mailto:)/i.test(href)) {
      setMediaError('Tautan harus memakai HTTPS, HTTP, atau mailto.')
      return
    }

    setMediaError('')
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setPanel('none')
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setPanel('none')
  }

  function insertImageFromUrl(source: string, alt: string) {
    if (!editor) return false

    const validation = validateGalleryImageUrl(source.trim())

    if (!validation.success) {
      setMediaError(validation.errors.join(' '))
      return false
    }

    setMediaError('')
    editor
      .chain()
      .focus()
      .setImage({ alt: alt.trim() || 'Dokumentasi HMTE', src: source.trim() })
      .run()
    return true
  }

  function insertEmbed() {
    if (!editor) return

    const embed = resolveEmbed(embedUrlDraft)

    if (!embed) {
      setMediaError(
        'Tautan itu belum bisa disisipkan. Untuk sekarang yang didukung: YouTube, Vimeo, Google Drive, Docs, Sheets, Slides, Form, Maps, dan Spotify.',
      )
      return
    }

    setMediaError('')
    editor
      .chain()
      .focus()
      .setArticleEmbed({
        aspect: embed.aspect,
        caption: embedCaptionDraft.trim(),
        provider: embed.provider,
        src: embed.src,
        title: embedCaptionDraft.trim() || `Sisipan ${embed.providerLabel}`,
      })
      .run()

    setEmbedUrlDraft('')
    setEmbedCaptionDraft('')
    setPanel('none')
  }

  async function handleUpload(file: File | undefined) {
    if (!file || !editor) return

    setMediaError('')
    const validation = validateArticleCoverImage(file)

    if (!validation.success) {
      setMediaError(validation.errors.join(' '))
      return
    }

    setIsUploading(true)

    try {
      const upload = await uploadImageToImageKit(file, 'berita', async () => {
        const currentUser = getFirebaseAuth().currentUser

        if (!currentUser) {
          throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        }

        return currentUser.getIdToken()
      })

      await registerUploadedMedia(upload, file, 'berita', { alt: imageAltDraft })

      if (insertImageFromUrl(upload.url, imageAltDraft)) {
        setPanel('none')
        setImageAltDraft('')
        setImageUrlDraft('')
      }
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)

      // Dikosongkan supaya memilih berkas yang sama dua kali tetap memicu
      // onChange. Tanpa ini, percobaan ulang setelah gagal terasa macet.
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function togglePanel(next: PanelMode) {
    setMediaError('')
    setPanel((current) => (current === next ? 'none' : next))
  }

  if (!editor) {
    return <div className="admin-rich-editor is-loading">Menyiapkan editor...</div>
  }

  const previewHtml = view === 'preview' ? editor.getHTML() : ''

  return (
    <div className="admin-rich-editor" data-focus-mode={isFocusMode ? 'on' : 'off'} data-view={view}>
      <div className="admin-editor-toolbar" aria-label="Peralatan format artikel">
        <div>
          <ToolbarButton
            active={toolbarState.isParagraph}
            disabled={view === 'preview'}
            label="Teks"
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraf"
          />
          <ToolbarButton
            active={toolbarState.isHeading2}
            disabled={view === 'preview'}
            label="H2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading utama"
          />
          <ToolbarButton
            active={toolbarState.isHeading3}
            disabled={view === 'preview'}
            label="H3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Subheading"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isBold}
            disabled={view === 'preview'}
            label="B"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Tebal (Ctrl+B)"
          />
          <ToolbarButton
            active={toolbarState.isItalic}
            disabled={view === 'preview'}
            label="I"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Miring (Ctrl+I)"
          />
          <ToolbarButton
            active={toolbarState.isUnderline}
            disabled={view === 'preview'}
            label="U"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Garis bawah (Ctrl+U)"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isBulletList}
            disabled={view === 'preview'}
            label="• List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Daftar poin"
          />
          <ToolbarButton
            active={toolbarState.isOrderedList}
            disabled={view === 'preview'}
            label="1. List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Daftar bernomor"
          />
          <ToolbarButton
            active={toolbarState.isBlockquote}
            disabled={view === 'preview'}
            label="Kutip"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Kutipan"
          />
          <ToolbarButton
            active={toolbarState.isCodeBlock}
            disabled={view === 'preview'}
            label="Kode"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Blok kode"
          />
          <ToolbarButton
            disabled={view === 'preview'}
            label="Pemisah"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Garis pemisah"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isLink || panel === 'link'}
            disabled={view === 'preview'}
            label="Tautan"
            onClick={openLinkPanel}
            title="Tambah tautan (Ctrl+K)"
          />
          <ToolbarButton
            active={panel === 'image'}
            disabled={view === 'preview'}
            label="Gambar"
            onClick={() => togglePanel('image')}
            title="Sisipkan gambar"
          />
          <ToolbarButton
            active={panel === 'embed'}
            disabled={view === 'preview'}
            label="Sisipan"
            onClick={() => togglePanel('embed')}
            title="Sisipkan video, dokumen, peta, atau audio"
          />
        </div>
        <div className="admin-editor-history">
          <ToolbarButton
            disabled={view === 'preview' || !editor.can().chain().focus().undo().run()}
            label="↶"
            onClick={() => editor.chain().focus().undo().run()}
            title="Urungkan"
          />
          <ToolbarButton
            disabled={view === 'preview' || !editor.can().chain().focus().redo().run()}
            label="↷"
            onClick={() => editor.chain().focus().redo().run()}
            title="Ulangi"
          />
          <ToolbarButton
            active={view === 'preview'}
            label={view === 'preview' ? 'Tulis' : 'Pratinjau'}
            onClick={() => {
              setPanel('none')
              setView(view === 'preview' ? 'edit' : 'preview')
            }}
            title={view === 'preview' ? 'Kembali menulis' : 'Lihat tampilan halaman publik'}
          />
          <ToolbarButton
            active={isFocusMode}
            label={isFocusMode ? 'Tutup' : 'Fokus'}
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? 'Keluar mode fokus (Esc)' : 'Mode fokus layar penuh'}
          />
        </div>
      </div>

      {/*
        Kontrol ukuran gambar. Muncul hanya saat ada gambar terpilih, karena
        tombol yang selalu tampil tapi hampir selalu tidak berlaku membuat
        toolbar terasa penuh tanpa menambah kemampuan.
      */}
      {toolbarState.isImage && view === 'edit' ? (
        <div className="admin-editor-contextbar" role="group" aria-label="Ukuran gambar terpilih">
          <span>Gambar</span>
          <div>
            {ARTICLE_IMAGE_SIZES.map((size) => (
              <ToolbarButton
                key={size}
                active={toolbarState.imageSize === size}
                label={ARTICLE_IMAGE_SIZE_LABELS[size]}
                onClick={() => editor.chain().focus().updateAttributes('image', { size }).run()}
                title={`Ukuran ${ARTICLE_IMAGE_SIZE_LABELS[size].toLowerCase()}`}
              />
            ))}
          </div>
          <div>
            {ARTICLE_IMAGE_ALIGNMENTS.map((align) => (
              <ToolbarButton
                key={align}
                active={toolbarState.imageAlign === align}
                disabled={toolbarState.imageSize === 'full'}
                label={ARTICLE_IMAGE_ALIGNMENT_LABELS[align]}
                onClick={() => editor.chain().focus().updateAttributes('image', { align }).run()}
                title={`Rata ${ARTICLE_IMAGE_ALIGNMENT_LABELS[align].toLowerCase()}`}
              />
            ))}
          </div>
          <ToolbarButton
            label="Hapus"
            onClick={() => editor.chain().focus().deleteSelection().run()}
            title="Hapus gambar"
          />
        </div>
      ) : null}

      {toolbarState.isEmbed && view === 'edit' ? (
        <div className="admin-editor-contextbar" role="group" aria-label="Sisipan terpilih">
          <span>Sisipan</span>
          <ToolbarButton
            label="Hapus"
            onClick={() => editor.chain().focus().deleteSelection().run()}
            title="Hapus sisipan"
          />
        </div>
      ) : null}

      {panel === 'link' ? (
        <div className="admin-editor-panel">
          <label>
            <span>Alamat tautan</span>
            <input
              autoFocus
              value={linkDraft}
              placeholder="hmte.ugm.ac.id atau mailto:hmte@ugm.ac.id"
              onChange={(event) => setLinkDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLink()
                }
              }}
            />
          </label>
          <div className="admin-editor-panel-actions">
            <button className="admin-primary-button" type="button" onClick={applyLink}>
              Pasang
            </button>
            {toolbarState.isLink ? (
              <button className="admin-secondary-button" type="button" onClick={removeLink}>
                Lepas
              </button>
            ) : null}
            <button className="admin-secondary-button" type="button" onClick={() => setPanel('none')}>
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {panel === 'image' ? (
        <div className="admin-editor-panel">
          <label>
            <span>Teks alternatif</span>
            <input
              autoFocus
              value={imageAltDraft}
              placeholder="Suasana pelatihan robotika di Lab Elektro"
              onChange={(event) => setImageAltDraft(event.target.value)}
            />
          </label>
          <label>
            <span>URL ImageKit</span>
            <input
              type="url"
              value={imageUrlDraft}
              placeholder="https://ik.imagekit.io/..."
              onChange={(event) => setImageUrlDraft(event.target.value)}
            />
          </label>
          <div className="admin-editor-panel-actions">
            <button
              className="admin-primary-button"
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Mengunggah...' : 'Unggah dari perangkat'}
            </button>
            <button
              className="admin-secondary-button"
              type="button"
              disabled={!imageUrlDraft.trim()}
              onClick={() => {
                if (insertImageFromUrl(imageUrlDraft, imageAltDraft)) {
                  setPanel('none')
                  setImageUrlDraft('')
                  setImageAltDraft('')
                }
              }}
            >
              Sisipkan dari URL
            </button>
            <button className="admin-secondary-button" type="button" onClick={() => setPanel('none')}>
              Batal
            </button>
          </div>
          <p className="admin-field-hint">
            Isi teks alternatif dulu. Teks itu yang dibaca pengunjung dengan pembaca layar, dan yang
            tampil kalau gambarnya gagal dimuat. Setelah gambar masuk, klik gambarnya untuk mengatur
            ukuran tampil.
          </p>
          <input
            className="admin-visually-hidden"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            tabIndex={-1}
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
        </div>
      ) : null}

      {panel === 'embed' ? (
        <div className="admin-editor-panel">
          <label>
            <span>Tautan yang mau disisipkan</span>
            <input
              autoFocus
              value={embedUrlDraft}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(event) => setEmbedUrlDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  insertEmbed()
                }
              }}
            />
          </label>
          <label>
            <span>Keterangan (opsional)</span>
            <input
              value={embedCaptionDraft}
              placeholder="Dokumentasi Musyawarah Besar 2026"
              onChange={(event) => setEmbedCaptionDraft(event.target.value)}
            />
          </label>

          {embedUrlDraft.trim() ? (
            <p className={resolvedEmbed ? 'admin-embed-verdict is-ok' : 'admin-embed-verdict is-unknown'}>
              {resolvedEmbed
                ? `Dikenali sebagai ${resolvedEmbed.providerLabel}.`
                : 'Layanan ini belum didukung. Pasang sebagai tautan biasa saja.'}
            </p>
          ) : null}

          <div className="admin-editor-panel-actions">
            <button className="admin-primary-button" type="button" disabled={!resolvedEmbed} onClick={insertEmbed}>
              Sisipkan
            </button>
            <button className="admin-secondary-button" type="button" onClick={() => setPanel('none')}>
              Batal
            </button>
          </div>

          <ul className="admin-embed-support">
            {EMBED_HINTS.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <p className="admin-field-hint">
            Sisipan hanya tampil kalau berkasnya bisa diakses publik. Dokumen Drive yang masih
            terbatas akan muncul sebagai kotak minta izin di halaman berita.
          </p>
        </div>
      ) : null}

      {/*
        Menu apung di atas teks yang sedang disorot. Formatnya yang paling sering
        dipakai saja: menyalin seluruh toolbar ke sini hanya memindahkan
        kebingungan, bukan mengurangi jarak tempuh.
      */}
      <BubbleMenu className="admin-editor-bubble" editor={editor}>
        <ToolbarButton
          active={toolbarState.isBold}
          label="B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Tebal"
        />
        <ToolbarButton
          active={toolbarState.isItalic}
          label="I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Miring"
        />
        <ToolbarButton
          active={toolbarState.isHeading2}
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading utama"
        />
        <ToolbarButton
          active={toolbarState.isLink}
          label="Tautan"
          onClick={openLinkPanel}
          title="Tambah tautan"
        />
      </BubbleMenu>

      {/*
        EditorContent tetap terpasang saat pratinjau, hanya disembunyikan.
        Melepasnya dari DOM akan membuang posisi kursor dan riwayat undo setiap
        kali penulis mengintip hasilnya.
      */}
      <div hidden={view === 'preview'}>
        <EditorContent editor={editor} />
      </div>

      {view === 'preview' ? (
        <div className="admin-editor-preview" data-device={previewDevice}>
          <div className="admin-editor-preview-bar">
            <span>Pratinjau halaman publik</span>
            <div>
              <ToolbarButton
                active={previewDevice === 'desktop'}
                label="Layar lebar"
                onClick={() => setPreviewDevice('desktop')}
                title="Pratinjau lebar layar komputer"
              />
              <ToolbarButton
                active={previewDevice === 'phone'}
                label="Ponsel"
                onClick={() => setPreviewDevice('phone')}
                title="Pratinjau lebar ponsel"
              />
            </div>
          </div>
          <div className="admin-editor-preview-stage">
            <article className="article-rich-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      ) : null}

      <div className="admin-editor-footer">
        <span>{toolbarState.words.toLocaleString('id-ID')} kata</span>
        <span>{toolbarState.characters.toLocaleString('id-ID')} karakter</span>
        <span>{toolbarState.readMinutes} menit baca</span>
      </div>

      {toolbarState.publishWarnings.length > 0 ? (
        <div className="admin-editor-publish-warning" role="status">
          {toolbarState.publishWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {mediaError ? (
        <p className="admin-editor-inline-error" role="alert">
          {mediaError}
        </p>
      ) : null}
    </div>
  )
}
