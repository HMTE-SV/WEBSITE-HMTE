import { describe, expect, it } from 'vitest'
import { validateGalleryImage, validateArticleCoverImage } from './media-validation'

describe('admin media validation', () => {
  it('accepts supported gallery images under 5MB', () => {
    const result = validateGalleryImage({
      name: 'kegiatan.webp',
      size: 5 * 1024 * 1024,
      type: 'image/webp',
    })

    expect(result).toEqual({
      success: true,
      errors: [],
    })
  })

  it('rejects unsupported image types', () => {
    const result = validateGalleryImage({
      name: 'arsip.gif',
      size: 1024,
      type: 'image/gif',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Format gambar harus JPG, PNG, atau WebP.')
  })

  it('rejects article covers over 3MB', () => {
    const result = validateArticleCoverImage({
      name: 'cover.png',
      size: 3 * 1024 * 1024 + 1,
      type: 'image/png',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Ukuran cover artikel maksimal 3MB.')
  })
})
