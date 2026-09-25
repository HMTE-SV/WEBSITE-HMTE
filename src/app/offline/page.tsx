import type { Metadata } from 'next'

/*
 * Halaman pengganti saat pengunjung offline dan halaman yang dituju belum
 * pernah dimuat. Disimpan service worker (src/sw/sw.ts) sejak kunjungan
 * pertama. Gayanya ditulis di sini, bukan di CSS global: saat offline, bisa
 * saja berkas CSS situs belum ada di cache.
 */

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Sedang offline · HMTE TRE SV UGM',
  robots: { index: false, follow: false },
}

const styles = `
  .offline-page {
    display: grid;
    min-height: 100svh;
    place-items: center;
    padding: 32px max(24px, env(safe-area-inset-right)) calc(32px + env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    color: #f0ede8;
    background: #011f4b;
    font-family: var(--font-body, system-ui), system-ui, sans-serif;
    text-align: center;
  }
  .offline-page > div { display: grid; justify-items: center; gap: 16px; max-width: 360px; }
  .offline-page img { width: 72px; height: 72px; border-radius: 18px; }
  .offline-page h1 { margin: 8px 0 0; font-family: var(--font-display, system-ui), system-ui, sans-serif; font-size: 28px; letter-spacing: -0.02em; }
  .offline-page p { margin: 0; color: rgba(255, 255, 255, 0.74); font-size: 16px; line-height: 1.6; }
  .offline-page nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
  .offline-page a { display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 999px; font-weight: 700; text-decoration: none; }
  .offline-page a:first-child { color: #001333; background: #f5b82e; }
  .offline-page a:last-child { color: #f0ede8; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3); }
  .offline-page a:focus-visible { outline: 2px solid #f5b82e; outline-offset: 3px; }
`

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <style>{styles}</style>
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ikon yang sudah di-precache; next/image butuh jaringan */}
        <img src="/icons/icon-192.png" alt="" width={72} height={72} />
        <h1>Sedang offline</h1>
        <p>Halaman ini belum tersimpan di perangkatmu. Periksa koneksi internet, lalu coba lagi.</p>
        <nav aria-label="Pilihan">
          {/* href kosong = alamat yang sedang dibuka, jadi "Coba lagi" bekerja tanpa JavaScript. */}
          <a href="">Coba lagi</a>
          {/* <a> biasa, bukan <Link>: navigasi penuh supaya permintaan halaman
              lewat service worker lagi, bukan fetch data klien yang pasti gagal. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Ke beranda</a>
        </nav>
      </div>
    </main>
  )
}
