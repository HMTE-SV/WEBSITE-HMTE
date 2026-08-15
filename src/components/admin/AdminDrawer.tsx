'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminConfirmDialog } from './AdminConfirmDialog'

/*
 * Dialog editor terpusat. Nama ekspor dipertahankan agar migrasi tidak
 * memaksa seluruh manager berubah sekaligus, tetapi perilakunya sekarang
 * berupa ruang kerja fokus yang konsisten di semua halaman admin.
 */

type AdminDrawerProps = {
  children: React.ReactNode
  /** Ringkasan singkat di bawah judul agar konteks editor tetap terbaca. */
  description?: string
  /** Ditampilkan di kaki laci. Tombol simpan menempel di sini. */
  footer?: React.ReactNode
  /** Diminta konfirmasi sebelum menutup saat ada perubahan belum tersimpan. */
  isDirty?: boolean
  onClose: () => void
  /** Workspace lebar untuk form panjang dan berkelompok. */
  size?: 'default' | 'wide'
  title: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AdminDrawer({
  children,
  description,
  footer,
  isDirty = false,
  onClose,
  size = 'default',
  title,
}: AdminDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Fokus dikembalikan ke elemen yang membuka laci. Tanpa ini, pengguna papan
  // ketik terlempar ke awal halaman setiap kali menutup laci.
  const openerRef = useRef<HTMLElement | null>(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  /*
   * Nilai ini memang harus selalu terbaru untuk Escape/tombol tutup, tetapi
   * tidak boleh menjadi dependensi efek yang memasang fokus awal. Sebelumnya
   * `onClose` baru lahir di setiap render parent dan `isDirty` berubah pada
   * ketikan pertama; akibatnya efek fokus dibongkar-pasang dan input pertama
   * direbut kembali setelah setiap karakter.
   */
  const isDirtyRef = useRef(isDirty)
  const isConfirmOpenRef = useRef(isConfirmOpen)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    isDirtyRef.current = isDirty
    isConfirmOpenRef.current = isConfirmOpen
    onCloseRef.current = onClose
  }, [isConfirmOpen, isDirty, onClose])

  const requestClose = useCallback(() => {
    if (isDirtyRef.current) {
      setIsConfirmOpen(true)
      return
    }

    onCloseRef.current()
  }, [])

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null

    const panel = panelRef.current
    const firstEditorControl = panel?.querySelector<HTMLElement>(
      '.adm-drawer-body input:not([disabled]), .adm-drawer-body textarea:not([disabled]), .adm-drawer-body select:not([disabled]), .adm-drawer-body button:not([disabled])',
    )
    ;(firstEditorControl ?? panel?.querySelector<HTMLElement>(FOCUSABLE))?.focus()

    function onKeyDown(event: KeyboardEvent) {
      /*
       * Saat dialog konfirmasi terbuka di atas laci, laci melepaskan papan
       * ketik sepenuhnya: Escape jadi milik dialog, dan perangkap Tab di bawah
       * ini harus mati supaya fokus bisa mencapai tombol dialognya. Tanpa
       * pelepasan ini, dua perangkap fokus berebut dan pengguna papan ketik
       * terkunci di laci yang sedang ia coba tinggalkan.
       */
      if (isConfirmOpenRef.current) return

      if (event.key === 'Escape') {
        event.stopPropagation()
        requestClose()
        return
      }

      // Fokus diperangkap selama laci terbuka: Tab yang lolos ke halaman di
      // belakang membuat pengguna papan ketik menyunting daftar yang sedang
      // tertutup tanpa tahu di mana kursornya.
      if (event.key !== 'Tab' || !panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      openerRef.current?.focus()
    }
  }, [requestClose])

  return (
    <>
      <button className="adm-scrim" type="button" aria-label="Tutup penyunting" onClick={requestClose} />
      <div
        className={`adm-editor-dialog${size === 'wide' ? ' adm-editor-dialog--wide' : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="adm-drawer-head">
          <div className="adm-drawer-heading">
            <span>Ruang penyuntingan</span>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            className="adm-btn adm-btn--ghost adm-btn--icon"
            style={{ marginLeft: 'auto' }}
            type="button"
            aria-label="Tutup"
            onClick={requestClose}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="adm-drawer-body">{children}</div>

        {footer ? <footer className="adm-drawer-foot">{footer}</footer> : null}
      </div>

      {isConfirmOpen ? (
        <AdminConfirmDialog
          body="Perubahan yang sudah kamu ketik akan hilang dan tidak bisa dikembalikan."
          cancelLabel="Lanjut menyunting"
          confirmLabel="Buang perubahan"
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false)
            onCloseRef.current()
          }}
          title="Tutup tanpa menyimpan?"
        />
      ) : null}
    </>
  )
}
