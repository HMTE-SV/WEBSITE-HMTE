'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { uploadImageToImageKit } from '@/lib/admin/imagekit-upload'
import { validateArticleCoverImage, validateGalleryImageUrl } from '@/lib/admin/media-validation'

/*
 * Editor artikel.
 *
 * Dasarnya tetap Tiptap, tapi tiga hal yang membuatnya terasa seperti alat
 * darurat sudah diganti:
 *
 * 1. window.prompt hilang. Menyisipkan gambar dulu berarti tiga kotak dialog
 *    beruntun, dan tidak satu pun bisa dibatalkan setengah jalan tanpa mengulang
 *    dari awal. Sekarang tautan dan gambar punya panel sendiri di dalam halaman.
 * 2. Gambar bisa diunggah, bukan cuma ditempel URL-nya. Jalur unggahnya sama
 *    persis dengan AdminImageField, jadi tidak ada pengetahuan ImageKit baru
 *    yang harus dihafal pengurus.
 * 3. Ada mode fokus dan penghitung kata. Menulis berita 800 kata di dalam kotak
 *    setinggi 300px, di tengah formulir yang penuh isian lain, adalah alasan
 *    utama orang menulis di tempat lain lalu menempelkannya ke sini.
 *
 * Batasnya tetap sanitizeArticleContent di src/lib/article-content.ts. Tidak
 * ada tombol di sini yang menghasilkan tag di luar daftar itu; menambahnya
 * hanya akan membuat pengurus memformat sesuatu yang lenyap saat terbit.
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

export function AdminRichTextEditor({ onChange, value }: AdminRichTextEditorProps) {
  const [mediaError, setMediaError] = useState('')
  const [panel, setPanel] = useState<'none' | 'link' | 'image'>('none')
  const [linkDraft, setLinkDraft] = useState('')
  const [imageUrlDraft, setImageUrlDraft] = useState('')
  const [imageAltDraft, setImageAltDraft] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
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
      ImageExtension.configure({
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
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

      return {
        characters: text.length,
        words,
        readMinutes: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
        isBlockquote: currentEditor?.isActive('blockquote') ?? false,
        isBold: currentEditor?.isActive('bold') ?? false,
        isBulletList: currentEditor?.isActive('bulletList') ?? false,
        isCodeBlock: currentEditor?.isActive('codeBlock') ?? false,
        isHeading2: currentEditor?.isActive('heading', { level: 2 }) ?? false,
        isHeading3: currentEditor?.isActive('heading', { level: 3 }) ?? false,
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
    isBlockquote: false,
    isBold: false,
    isBulletList: false,
    isCodeBlock: false,
    isHeading2: false,
    isHeading3: false,
    isItalic: false,
    isLink: false,
    isOrderedList: false,
    isParagraph: false,
    isUnderline: false,
  }

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
      const url = await uploadImageToImageKit(file, 'berita', async () => {
        const currentUser = getFirebaseAuth().currentUser

        if (!currentUser) {
          throw new Error('Sesi admin sudah berakhir. Masuk ulang lalu coba lagi.')
        }

        return currentUser.getIdToken()
      })

      if (insertImageFromUrl(url, imageAltDraft)) {
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

  if (!editor) {
    return <div className="admin-rich-editor is-loading">Menyiapkan editor...</div>
  }

  return (
    <div className="admin-rich-editor" data-focus-mode={isFocusMode ? 'on' : 'off'}>
      <div className="admin-editor-toolbar" aria-label="Peralatan format artikel">
        <div>
          <ToolbarButton
            active={toolbarState.isParagraph}
            label="Teks"
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraf"
          />
          <ToolbarButton
            active={toolbarState.isHeading2}
            label="H2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading utama"
          />
          <ToolbarButton
            active={toolbarState.isHeading3}
            label="H3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Subheading"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isBold}
            label="B"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Tebal (Ctrl+B)"
          />
          <ToolbarButton
            active={toolbarState.isItalic}
            label="I"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Miring (Ctrl+I)"
          />
          <ToolbarButton
            active={toolbarState.isUnderline}
            label="U"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Garis bawah (Ctrl+U)"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isBulletList}
            label="• List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Daftar poin"
          />
          <ToolbarButton
            active={toolbarState.isOrderedList}
            label="1. List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Daftar bernomor"
          />
          <ToolbarButton
            active={toolbarState.isBlockquote}
            label="Kutip"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Kutipan"
          />
          <ToolbarButton
            active={toolbarState.isCodeBlock}
            label="Kode"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Blok kode"
          />
          <ToolbarButton
            label="Pemisah"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Garis pemisah"
          />
        </div>
        <div>
          <ToolbarButton
            active={toolbarState.isLink || panel === 'link'}
            label="Tautan"
            onClick={openLinkPanel}
            title="Tambah tautan (Ctrl+K)"
          />
          <ToolbarButton
            active={panel === 'image'}
            label="Gambar"
            onClick={() => {
              setMediaError('')
              setPanel(panel === 'image' ? 'none' : 'image')
            }}
            title="Sisipkan gambar"
          />
        </div>
        <div className="admin-editor-history">
          <ToolbarButton
            disabled={!editor.can().chain().focus().undo().run()}
            label="↶"
            onClick={() => editor.chain().focus().undo().run()}
            title="Urungkan"
          />
          <ToolbarButton
            disabled={!editor.can().chain().focus().redo().run()}
            label="↷"
            onClick={() => editor.chain().focus().redo().run()}
            title="Ulangi"
          />
          <ToolbarButton
            active={isFocusMode}
            label={isFocusMode ? 'Tutup' : 'Fokus'}
            onClick={() => setIsFocusMode(!isFocusMode)}
            title={isFocusMode ? 'Keluar mode fokus (Esc)' : 'Mode fokus layar penuh'}
          />
        </div>
      </div>

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
            tampil kalau gambarnya gagal dimuat.
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

      <EditorContent editor={editor} />

      <div className="admin-editor-footer">
        <span>{toolbarState.words.toLocaleString('id-ID')} kata</span>
        <span>{toolbarState.characters.toLocaleString('id-ID')} karakter</span>
        <span>{toolbarState.readMinutes} menit baca</span>
      </div>

      {mediaError ? (
        <p className="admin-editor-inline-error" role="alert">
          {mediaError}
        </p>
      ) : null}
    </div>
  )
}
