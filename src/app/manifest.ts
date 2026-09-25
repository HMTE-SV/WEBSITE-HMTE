import type { MetadataRoute } from 'next'

/*
 * Manifest PWA. Ikon diturunkan dari favicon (public/assets/favicon.svg):
 * "any" bersudut membulat seperti favicon, "maskable" penuh tanpa sudut
 * supaya launcher Android bisa memotongnya ke bentuk apa pun.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'HMTE TRE SV UGM',
    short_name: 'HMTE',
    description: 'Kabar, agenda, dan organisasi HMTE TRE SV UGM.',
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#011f4b',
    theme_color: '#011f4b',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
