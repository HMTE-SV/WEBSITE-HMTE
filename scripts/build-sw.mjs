/*
 * Membundel src/sw/sw.ts → public/sw.js. Dijalankan sebelum `next build`
 * (lihat skrip "build" di package.json).
 *
 * Revisi /offline harus berganti tiap build: HTML-nya merujuk potongan JS/CSS
 * ber-hash dari build itu. Di Vercel dipakai SHA commit; di lokal, waktu.
 */
import { build } from 'esbuild'

const revision = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())

await build({
  entryPoints: ['src/sw/sw.ts'],
  outfile: 'public/sw.js',
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  legalComments: 'none',
  define: { __OFFLINE_REVISION__: JSON.stringify(revision) },
  logLevel: 'info',
})
