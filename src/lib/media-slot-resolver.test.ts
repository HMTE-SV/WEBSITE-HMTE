import { describe, expect, it } from 'vitest'
import { mediaSlotDefinitions } from '@/data/media-slots'
import { resolveMediaSlots } from '@/lib/media-slot-resolver'

describe('resolveMediaSlots', () => {
  it('menghasilkan fallback untuk setiap kontrak slot', () => {
    const resolved = resolveMediaSlots()

    expect(Object.keys(resolved)).toHaveLength(mediaSlotDefinitions.length)
    expect(resolved['brand.logo.primary']).toMatchObject({
      url: '/assets/logo-hmte.svg',
      focalPointX: 50,
      focalPointY: 50,
    })
  })

  it('memakai proyeksi media publik tanpa membutuhkan dokumen media', () => {
    const resolved = resolveMediaSlots([
      {
        id: 'home.hero.1',
        slotKey: 'home.hero.1',
        mediaUrl: 'https://ik.imagekit.io/jk001122/situs/hero.webp',
        mediaAlt: 'Pengurus HMTE di depan gedung sekolah vokasi',
        mediaWidth: 1600,
        mediaHeight: 900,
        focalPointX: 63,
        focalPointY: 38,
      },
    ])

    expect(resolved['home.hero.1']).toMatchObject({
      url: 'https://ik.imagekit.io/jk001122/situs/hero.webp',
      alt: 'Pengurus HMTE di depan gedung sekolah vokasi',
      width: 1600,
      height: 900,
      focalPointX: 63,
      focalPointY: 38,
    })
  })

  it('mengabaikan mediaId lama yang belum memiliki proyeksi publik', () => {
    const resolved = resolveMediaSlots([
      { id: 'contact.featured', slotKey: 'contact.featured', mediaId: 'old-media' },
    ])

    expect(resolved['contact.featured'].url).toBe('/assets/abya-vistara/kegiatan-03.webp')
  })

  it('menjaga focal point dalam rentang persentase', () => {
    const resolved = resolveMediaSlots([
      {
        id: 'home.moment.1',
        slotKey: 'home.moment.1',
        mediaUrl: 'https://ik.imagekit.io/jk001122/situs/moment.webp',
        focalPointX: 140,
        focalPointY: -12,
      },
    ])

    expect(resolved['home.moment.1'].focalPointX).toBe(100)
    expect(resolved['home.moment.1'].focalPointY).toBe(0)
  })
})
