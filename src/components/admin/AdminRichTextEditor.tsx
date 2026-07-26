'use client'

import { useEffect, useState } from 'react'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { validateGalleryImageUrl } from '@/lib/admin/media-validation'

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

export function AdminRichTextEditor({ onChange, value }: AdminRichTextEditorProps) {
  const [mediaError, setMediaError] = useState('')
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
    selector: ({ editor: currentEditor }) => ({
      characters: currentEditor?.getText().length ?? 0,
      isBlockquote: currentEditor?.isActive('blockquote') ?? false,
      isBold: currentEditor?.isActive('bold') ?? false,
      isBulletList: currentEditor?.isActive('bulletList') ?? false,
      isHeading2: currentEditor?.isActive('heading', { level: 2 }) ?? false,
      isHeading3: currentEditor?.isActive('heading', { level: 3 }) ?? false,
      isItalic: currentEditor?.isActive('italic') ?? false,
      isLink: currentEditor?.isActive('link') ?? false,
      isOrderedList: currentEditor?.isActive('orderedList') ?? false,
      isParagraph: currentEditor?.isActive('paragraph') ?? false,
      isUnderline: currentEditor?.isActive('underline') ?? false,
    }),
  })
  const toolbarState = editorState ?? {
    characters: 0,
    isBlockquote: false,
    isBold: false,
    isBulletList: false,
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

  function setLink() {
    if (!editor) {
      return
    }

    const currentUrl = String(editor.getAttributes('link').href || '')
    const nextUrl = window.prompt('Masukkan URL HTTPS atau email:', currentUrl)

    if (nextUrl === null) {
      return
    }

    if (!nextUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const normalizedUrl = nextUrl.includes(':') ? nextUrl.trim() : `https://${nextUrl.trim()}`

    if (!/^(https?:|mailto:)/i.test(normalizedUrl)) {
      setMediaError('Tautan harus memakai HTTPS, HTTP, atau mailto.')
      return
    }

    setMediaError('')
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run()
  }

  function insertImage() {
    if (!editor) {
      return
    }

    const source = window.prompt('Tempel URL gambar ImageKit:')

    if (!source) {
      return
    }

    const validation = validateGalleryImageUrl(source.trim())

    if (!validation.success) {
      setMediaError(validation.errors.join(' '))
      return
    }

    const alt = window.prompt('Teks alternatif gambar:', '')?.trim() || 'Dokumentasi HMTE'
    setMediaError('')
    editor.chain().focus().setImage({ alt, src: source.trim() }).run()
  }

  if (!editor) {
    return <div className="admin-rich-editor is-loading">Menyiapkan editor...</div>
  }

  return (
    <div className="admin-rich-editor">
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
            title="Tebal"
          />
          <ToolbarButton
            active={toolbarState.isItalic}
            label="I"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Miring"
          />
          <ToolbarButton
            active={toolbarState.isUnderline}
            label="U"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Garis bawah"
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
        </div>
        <div>
          <ToolbarButton active={toolbarState.isLink} label="Tautan" onClick={setLink} title="Tambah tautan" />
          <ToolbarButton label="Gambar" onClick={insertImage} title="Sisipkan gambar ImageKit" />
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
        </div>
      </div>
      <EditorContent editor={editor} />
      <div className="admin-editor-footer">
        <span>{toolbarState.characters.toLocaleString('id-ID')} karakter</span>
        <span>Gambar artikel memakai URL ImageKit</span>
      </div>
      {mediaError ? (
        <p className="admin-editor-inline-error" role="alert">
          {mediaError}
        </p>
      ) : null}
    </div>
  )
}
