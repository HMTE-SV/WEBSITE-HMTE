import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from 'serwist'

/*
 * Service worker situs. Dibundel scripts/build-sw.mjs ke public/sw.js
 * sebelum `next build`; berkas hasilnya tidak masuk git.
 *
 * Prinsipnya: yang disimpan hanya aset statis publik yang sama untuk semua
 * orang. HTML, data, dan apa pun di bawah /api, /admin, atau arsip TIDAK
 * pernah masuk cache — permintaan yang tidak cocok dengan rute di bawah
 * dilewatkan ke jaringan tanpa disentuh. Halaman yang gagal dimuat karena
 * offline diganti /offline.
 */

declare const __OFFLINE_REVISION__: string

const DAY = 24 * 60 * 60
const IMAGE_FILE = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i

const serwist = new Serwist({
  precacheEntries: [
    { url: '/offline', revision: __OFFLINE_REVISION__ },
    { url: '/icons/icon-192.png', revision: __OFFLINE_REVISION__ },
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      // JS, CSS, dan font next/font: namanya memuat hash isi, jadi aman
      // diambil dari cache tanpa bertanya ke jaringan.
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
      handler: new CacheFirst({
        cacheName: 'hmte-static',
        plugins: [new ExpirationPlugin({ maxEntries: 250, maxAgeSeconds: 30 * DAY })],
      }),
    },
    {
      // Gambar yang sudah dioptimasi next/image dan gambar di /assets, /icons.
      // Berkas unduhan (/assets/unduhan) sengaja tidak: bisa besar dan
      // pengunjung mengunduhnya untuk disimpan sendiri.
      matcher: ({ sameOrigin, url }) =>
        sameOrigin &&
        (url.pathname === '/_next/image' ||
          ((url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) &&
            !url.pathname.startsWith('/assets/unduhan/') &&
            IMAGE_FILE.test(url.pathname))),
      handler: new StaleWhileRevalidate({
        cacheName: 'hmte-images',
        plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * DAY })],
      }),
    },
    {
      // Halaman selalu dari jaringan — tidak pernah disimpan — dan jatuh ke
      // /offline hanya kalau jaringan memang tidak ada.
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()
