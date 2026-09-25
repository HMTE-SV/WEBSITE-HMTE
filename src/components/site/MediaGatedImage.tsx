import { getImageProps, type ImageProps } from 'next/image'

/*
 * next/image yang hanya diunduh saat `media` cocok.
 *
 * Beranda punya dua pembuka yang dipilih CSS (Hero.tsx untuk layar lebar,
 * HeroOpener.tsx untuk HP & mode aplikasi). `display: none` tidak mencegah
 * unduhan gambar eager atau `priority` — preload tetap jalan — jadi HP ikut
 * mengunduh slide desktop selebar 100vw yang tidak pernah terlihat.
 *
 * <picture> menyelesaikannya di tingkat peramban, tanpa JS dan tanpa kedip:
 * di luar `media`, <source> menyodorkan GIF 1×1 dan gambar aslinya tidak
 * pernah diminta. Pola ini sama dengan art direction di dokumentasi Next
 * (getImageProps + <picture>). Tidak ada <link rel="preload">, jadi gambar
 * penting cukup diberi loading="eager" dan fetchPriority="high".
 */

const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

type MediaGatedImageProps = Omit<ImageProps, 'priority' | 'preload'> & {
  /** Media query tunggal (tanpa koma) tempat gambar ini boleh diunduh. */
  media: string
}

export function MediaGatedImage({ media, ...imageProps }: MediaGatedImageProps) {
  const { props } = getImageProps(imageProps)

  return (
    <picture>
      <source media={`not all and ${media}`} srcSet={BLANK_GIF} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt ikut di props dari getImageProps */}
      <img {...props} />
    </picture>
  )
}
