import Image from 'next/image'
import { HeroBackdrop } from './HeroBackdrop'
import { pickArticleCoverArt } from '@/lib/article-cover'

/*
 * Slot sampul berita. Ada gambar, pakai gambar. Tidak ada, gambar sendiri.
 *
 * Dibuat satu komponen supaya keputusan itu hidup di satu tempat saja. Sebelum
 * ini tiap pemanggil menulis <Image src={article.image}> sendiri-sendiri, dan
 * karena itu satu foto cadangan buatan mesin menyebar ke seluruh situs lewat
 * satu konstanta di article-data.ts.
 *
 * Pemanggil tetap yang mengatur ukuran: komponen ini hanya mengisi kotak yang
 * sudah punya position, persis seperti <Image fill>.
 */

type ArticleCoverProps = {
  src: string
  alt: string
  /** Dipakai sebagai benih bentuk abstrak ketika `src` kosong. */
  slug: string
  sizes: string
  priority?: boolean
  className?: string
  /** Untuk lapisan latar yang murni hiasan, mis. ambient di balik kartu. */
  decorative?: boolean
}

export function ArticleCover({
  src,
  alt,
  slug,
  sizes,
  priority = false,
  className,
  decorative = false,
}: ArticleCoverProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={decorative ? '' : alt}
        aria-hidden={decorative || undefined}
        className={className}
        fill
        priority={priority}
        sizes={sizes}
      />
    )
  }

  const { flip, variant } = pickArticleCoverArt(slug)

  return (
    <span className={className ? `article-cover-art ${className}` : 'article-cover-art'} data-flip={flip}>
      {/*
        `mesh` dimatikan. Kisi 88px dirancang untuk hero selebar layar; di dalam
        kartu selebar 320px ia tinggal empat garis dan langsung terbaca sebagai
        garis, bukan tekstur.
      */}
      <HeroBackdrop mesh={false} variant={variant} />
    </span>
  )
}
