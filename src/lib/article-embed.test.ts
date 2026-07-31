import { describe, expect, it } from 'vitest'
import { isAllowedEmbedSrc, resolveEmbed } from './article-embed'

describe('resolveEmbed', () => {
  it('mengenali semua bentuk tautan YouTube yang biasa disalin', () => {
    const expected = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'

    expect(resolveEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.src).toBe(expected)
    expect(resolveEmbed('https://youtu.be/dQw4w9WgXcQ')?.src).toBe(expected)
    expect(resolveEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.src).toBe(expected)
    expect(resolveEmbed('https://www.youtube.com/live/dQw4w9WgXcQ')?.src).toBe(expected)
    expect(resolveEmbed('youtu.be/dQw4w9WgXcQ')?.src).toBe(expected)
  })

  it('mempertahankan waktu mulai video', () => {
    expect(resolveEmbed('https://youtu.be/dQw4w9WgXcQ?t=90')?.src).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90',
    )
    expect(resolveEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')?.src).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90',
    )
  })

  it('mengubah tautan Google menjadi bentuk preview', () => {
    expect(resolveEmbed('https://drive.google.com/file/d/1AbC_dEf/view?usp=sharing')?.src).toBe(
      'https://drive.google.com/file/d/1AbC_dEf/preview',
    )
    expect(resolveEmbed('https://docs.google.com/document/d/1AbC_dEf/edit')?.src).toBe(
      'https://docs.google.com/document/d/1AbC_dEf/preview',
    )
    expect(resolveEmbed('https://docs.google.com/presentation/d/1AbC_dEf/edit#slide=id.p')?.src).toBe(
      'https://docs.google.com/presentation/d/1AbC_dEf/embed',
    )
    expect(resolveEmbed('https://docs.google.com/forms/d/e/1AbC_dEf/viewform')?.src).toBe(
      'https://docs.google.com/forms/d/e/1AbC_dEf/viewform?embedded=true',
    )
  })

  it('mengenali Vimeo dan Spotify beserta jenis kontennya', () => {
    expect(resolveEmbed('https://vimeo.com/76979871')?.src).toBe('https://player.vimeo.com/video/76979871')
    expect(resolveEmbed('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=x')?.src).toBe(
      'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
    )
    expect(resolveEmbed('https://open.spotify.com/intl-id/album/4cOdK2wGLETKBW3PvgPWqT')?.aspect).toBe('audio')
  })

  it('menolak layanan yang belum didukung dan tautan tidak aman', () => {
    expect(resolveEmbed('https://www.tiktok.com/@hmte/video/123')).toBeNull()
    expect(resolveEmbed('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(resolveEmbed('javascript:alert(1)')).toBeNull()
    expect(resolveEmbed('')).toBeNull()
  })

  it('hanya menerima Google Maps yang sudah berbentuk embed', () => {
    expect(resolveEmbed('https://www.google.com/maps/embed?pb=!1m18')?.provider).toBe('google-maps')
    expect(resolveEmbed('https://www.google.com/maps/place/UGM')).toBeNull()
  })
})

describe('isAllowedEmbedSrc', () => {
  it('menerima hasil resolveEmbed', () => {
    const sources = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com/76979871',
      'https://drive.google.com/file/d/1AbC_dEf/view',
      'https://docs.google.com/spreadsheets/d/1AbC_dEf/edit',
      'https://open.spotify.com/playlist/4cOdK2wGLETKBW3PvgPWqT',
    ]

    for (const source of sources) {
      const embed = resolveEmbed(source)
      expect(embed).not.toBeNull()
      expect(isAllowedEmbedSrc(embed?.src)).toBe(true)
    }
  })

  it('menolak host lain, skema lain, dan host yang menyamar', () => {
    expect(isAllowedEmbedSrc('https://evil.example.com/embed/x')).toBe(false)
    expect(isAllowedEmbedSrc('http://www.youtube-nocookie.com/embed/x')).toBe(false)
    expect(isAllowedEmbedSrc('https://www.youtube-nocookie.com.evil.com/embed/x')).toBe(false)
    expect(isAllowedEmbedSrc('https://drive.google.com/file/d/1AbC/view')).toBe(false)
    expect(isAllowedEmbedSrc('javascript:alert(1)')).toBe(false)
    expect(isAllowedEmbedSrc(undefined)).toBe(false)
  })
})
