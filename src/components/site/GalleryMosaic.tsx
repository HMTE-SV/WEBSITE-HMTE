'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { PublicGalleryItem } from '@/lib/gallery-data'

/*
 * Mosaik galeri + pratinjau layar penuh.
 *
 * Tiap foto mendapat tombol pembuka transparan setinggi fotonya; tampilan
 * mosaik tidak berubah. Pratinjaunya <dialog> + showModal() seperti lembar
 * menu (MobileMenu.tsx): perangkap fokus, Escape, dan latar inert sudah
 * disediakan peramban. Geser kiri/kanan di layar sentuh, panah di papan
 * ketik, dan tombol 44px untuk yang lain.
 */

const SWIPE_THRESHOLD = 48

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function GalleryMosaic({ items }: { items: PublicGalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const lastOpenedRef = useRef<number | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  const isOpen = openIndex !== null
  const current = isOpen ? items[openIndex] : null

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
      document.documentElement.classList.add('has-gallery-viewer')
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  // Foto yang terakhir dilihat, bukan yang pertama dibuka: setelah menggeser
  // ke foto ke-7, menutup pratinjau mengembalikan fokus ke foto ke-7.
  useEffect(() => {
    if (openIndex !== null) lastOpenedRef.current = openIndex
  }, [openIndex])

  function open(index: number) {
    setOpenIndex(index)
  }

  function step(delta: number) {
    setOpenIndex((index) => (index === null ? index : (index + delta + items.length) % items.length))
  }

  function handleClose() {
    document.documentElement.classList.remove('has-gallery-viewer')
    setOpenIndex(null)
    // Safari tidak memfokuskan tombol yang diketuk, jadi <dialog> tidak tahu
    // harus mengembalikan fokus ke mana. Kembalikan ke foto yang sedang dilihat.
    const index = lastOpenedRef.current
    lastOpenedRef.current = null
    if (index !== null) window.setTimeout(() => openerRefs.current[index]?.focus(), 0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'ArrowRight') step(1)
    if (event.key === 'ArrowLeft') step(-1)
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) handleClose()
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse') return
    swipeStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return
    step(dx < 0 ? 1 : -1)
  }

  return (
    <>
      <div className="gallery-mosaic">
        {/*
          Tidak ada <Link> membungkus tiap foto. Dulu setiap kartu menuju
          /berita/[slug] karena isinya memang sampul berita yang di-dedup,
          bukan dokumentasi. Item galeri berdiri sendiri dan tidak punya
          halaman tujuan; yang ada sekarang tombol pratinjau.
        */}
        {items.map((item, index) => (
          <div
            className={index === 0 ? 'gallery-mosaic-item is-lead' : 'gallery-mosaic-item'}
            key={item.id}
          >
            <figure>
              <Image
                src={item.imageUrl}
                alt={item.alt}
                fill
                priority={index === 0}
                // ≤900px: foto utama selebar penuh, sisanya dua kolom.
                sizes={index === 0 ? '(max-width: 900px) 100vw, 58vw' : '(max-width: 900px) 50vw, 34vw'}
              />
              <span className="gallery-mosaic-index">{pad(index + 1)}</span>
              <figcaption>
                <h3>{item.title}</h3>
                {item.caption ? <p>{item.caption}</p> : null}
              </figcaption>
            </figure>
            <button
              type="button"
              className="gallery-mosaic-open"
              ref={(element) => { openerRefs.current[index] = element }}
              aria-haspopup="dialog"
              onClick={() => open(index)}
            >
              <span className="sr-only">Lihat foto layar penuh: {item.title}</span>
            </button>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="gallery-viewer"
        aria-label={current ? `Foto ${pad((openIndex ?? 0) + 1)} dari ${pad(items.length)}: ${current.title}` : 'Pratinjau foto'}
        onClose={handleClose}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
      >
        {current ? (
          <>
            <div className="gallery-viewer-top">
              <p className="gallery-viewer-count" aria-hidden="true">
                {pad((openIndex ?? 0) + 1)} <span>/ {pad(items.length)}</span>
              </p>
              <button type="button" className="gallery-viewer-button" onClick={handleClose} aria-label="Tutup pratinjau">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div
              className="gallery-viewer-stage"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { swipeStartRef.current = null }}
            >
              <Image key={current.id} src={current.imageUrl} alt={current.alt} fill sizes="100vw" />
            </div>

            <div className="gallery-viewer-bottom">
              <button type="button" className="gallery-viewer-button" onClick={() => step(-1)} aria-label="Foto sebelumnya" disabled={items.length < 2}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <div className="gallery-viewer-caption" aria-live="polite">
                <h2>{current.title}</h2>
                {current.caption ? <p>{current.caption}</p> : null}
              </div>
              <button type="button" className="gallery-viewer-button" onClick={() => step(1)} aria-label="Foto berikutnya" disabled={items.length < 2}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  )
}
