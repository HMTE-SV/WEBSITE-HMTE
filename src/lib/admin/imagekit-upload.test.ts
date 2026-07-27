import { describe, expect, it } from 'vitest'
import { buildUploadFileName } from './imagekit-upload'

const uploadDate = new Date('2026-07-28T09:15:00Z')

describe('imagekit upload file names', () => {
  it('stamps the date and slugifies the original name', () => {
    expect(buildUploadFileName('Foto Ketua Himpunan.JPG', uploadDate)).toBe('20260728-foto-ketua-himpunan.jpg')
  })

  it('keeps the extension lowercase and strips the rest of the name', () => {
    expect(buildUploadFileName('Rapat (final) #2.PNG', uploadDate)).toBe('20260728-rapat-final-2.png')
  })

  it('falls back to jpg when the file has no usable extension', () => {
    expect(buildUploadFileName('scan', uploadDate)).toBe('20260728-scan.jpg')
    expect(buildUploadFileName('arsip.tar.gz~', uploadDate)).toBe('20260728-arsip-tar.jpg')
  })

  it('never produces an empty name for non-latin file names', () => {
    expect(buildUploadFileName('写真.webp', uploadDate)).toBe('20260728-gambar.webp')
  })

  it('does not treat a leading dot as an extension separator', () => {
    expect(buildUploadFileName('.gitkeep', uploadDate)).toBe('20260728-gitkeep.jpg')
  })
})
