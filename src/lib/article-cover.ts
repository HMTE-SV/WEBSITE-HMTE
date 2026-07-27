import { heroBackdropVariants, type HeroBackdropVariant } from '@/components/site/HeroBackdrop'

/*
 * Sampul untuk berita yang tidak punya gambar.
 *
 * Sebelumnya semua berita tanpa sampul memakai satu foto yang sama, dan foto
 * itu buatan mesin. Satu gambar yang berulang di seluruh feed lebih buruk
 * daripada tidak ada gambar sama sekali: pembaca membacanya sebagai "semua
 * berita ini tentang hal yang sama".
 *
 * Gantinya bukan gambar lain, tapi bidang abstrak yang sama dengan latar hero
 * /berita. Karena itu tidak ada berkas yang perlu diunggah, tidak ada yang
 * perlu dioptimasi, dan tampilannya otomatis ikut token warna situs.
 *
 * Berkas ini sengaja murni. Tidak mengimpor React, tidak menyentuh Firebase,
 * jadi pemilihan varian bisa diuji tanpa merender apa pun.
 */

/** Empat cerminan sumbu, jadi lima bentuk dasar menghasilkan dua puluh sampul. */
export const coverFlips = ['none', 'x', 'y', 'xy'] as const

export type CoverFlip = (typeof coverFlips)[number]

export type ArticleCoverArt = {
  variant: HeroBackdropVariant
  flip: CoverFlip
}

/*
 * FNV-1a 32-bit. Dipilih bukan karena mutunya sebagai hash, melainkan karena
 * hasilnya stabil lintas proses: sampul harus sama persis antara render di
 * server dan di browser, kalau tidak React akan melaporkan ketidakcocokan
 * hidrasi pada setiap kartu berita.
 */
function hashSlug(slug: string) {
  let hash = 0x811c9dc5

  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

/**
 * Memilih bentuk sampul dari slug. Deterministik: berita yang sama selalu
 * mendapat sampul yang sama, jadi pembaca yang kembali mengenalinya.
 */
export function pickArticleCoverArt(slug: string): ArticleCoverArt {
  const hash = hashSlug(slug)

  return {
    // Pembagi kedua diambil dari hash yang sudah digeser, bukan dari hash yang
    // sama, supaya varian dan cerminan tidak bergerak seiring.
    flip: coverFlips[(hash >>> 8) % coverFlips.length],
    variant: heroBackdropVariants[hash % heroBackdropVariants.length],
  }
}
