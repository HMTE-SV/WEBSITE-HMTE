import { describe, expect, it } from 'vitest'
import { heroBackdropVariants } from '@/components/site/HeroBackdrop'
import { coverFlips, pickArticleCoverArt } from './article-cover'

describe('pickArticleCoverArt', () => {
  it('selalu memilih varian dan cerminan yang sah', () => {
    const slugs = ['halal-bihalal-hmte', 'juara-kontes-robot', 'a', '', 'ðŸ˜€-emoji']

    slugs.forEach((slug) => {
      const art = pickArticleCoverArt(slug)
      expect(heroBackdropVariants).toContain(art.variant)
      expect(coverFlips).toContain(art.flip)
    })
  })

  /*
   * Ini syarat yang sesungguhnya dijaga. Kalau hasilnya berubah antara render
   * di server dan di browser, React melaporkan ketidakcocokan hidrasi di setiap
   * kartu berita, dan sampulnya berkedip ganti bentuk saat halaman dimuat.
   */
  it('deterministik untuk slug yang sama', () => {
    expect(pickArticleCoverArt('juara-kontes-robot')).toEqual(pickArticleCoverArt('juara-kontes-robot'))
  })

  it('menyebar ke lebih dari satu bentuk', () => {
    const combinations = new Set(
      Array.from({ length: 60 }, (_, index) => {
        const art = pickArticleCoverArt(`berita-hmte-${index}`)
        return `${art.variant}-${art.flip}`
      }),
    )

    // Dua puluh kombinasi tersedia. Menuntut minimal delapan sudah cukup untuk
    // menangkap hash yang macet di satu nilai tanpa membuat tes ini rapuh.
    expect(combinations.size).toBeGreaterThanOrEqual(8)
  })
})
