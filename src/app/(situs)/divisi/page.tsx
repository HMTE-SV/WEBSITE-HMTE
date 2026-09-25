import { permanentRedirect } from 'next/navigation'

/*
 * /divisi dulu berupa papan delapan bidang yang berdiri sendiri, terpisah dari
 * direktori orang di /kepengurusan. Keduanya sekarang satu halaman.
 *
 * Rutenya dipertahankan sebagai pengalihan permanen, bukan dihapus, karena
 * alamat ini sudah tersebar: ada di kaki halaman versi lama, di sitemap yang
 * sudah dirayapi, dan di tautan yang dibagikan pengurus. 301 memindahkan
 * peringkat pencariannya sekalian; 404 membuangnya.
 *
 * Rincian tiap bidang TIDAK ikut pindah dan tetap di /divisi/[slug].
 */
export default function DivisionsIndexPage() {
  permanentRedirect('/kepengurusan')
}
