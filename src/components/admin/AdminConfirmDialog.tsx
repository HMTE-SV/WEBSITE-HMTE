'use client'

import { useEffect, useRef } from 'react'

/*
 * Modal kecil khusus konfirmasi tindakan merusak. Larangan #6 di
 * docs/DESIGN_ADMIN.md: modal bukan tempat menyunting, hanya tempat berhenti
 * sejenak sebelum sesuatu yang tidak bisa dibatalkan terjadi. `window.confirm`
 * yang dipakai sebelumnya tidak bisa diberi gaya dan tidak konsisten antar
 * peramban — pengurus yang buru-buru bisa menekan Enter tanpa membaca.
 *
 * Dipakai bersama di kelima rute Publikasi supaya konfirmasi hapus selalu
 * terlihat sama, bukan didesain ulang per halaman.
 */

type AdminConfirmDialogProps = {
  body: string
  cancelLabel?: string
  confirmLabel?: string
  isBusy?: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
}

export function AdminConfirmDialog({
  body,
  cancelLabel = 'Batal',
  confirmLabel = 'Hapus',
  isBusy = false,
  onCancel,
  onConfirm,
  title,
}: AdminConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isBusy) {
        event.stopPropagation()
        onCancel()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      openerRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <button className="adm-scrim" type="button" aria-label="Tutup" onClick={isBusy ? undefined : onCancel} />
      <div className="adm-confirm" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="adm-confirm-actions">
          <button className="adm-btn adm-btn--ghost" type="button" disabled={isBusy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="adm-btn adm-btn--danger"
            disabled={isBusy}
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {isBusy ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
