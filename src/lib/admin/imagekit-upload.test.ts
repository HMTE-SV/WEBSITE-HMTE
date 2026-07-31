import { describe, expect, it } from 'vitest'
import { buildUploadFileName, normalizeImageKitUploadResult } from './imagekit-upload'

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

describe('normalizeImageKitUploadResult', () => {
  const fallbackFile = { size: 2048, type: 'image/webp' }

  it('menerima field `name` dari respons resmi ImageKit', () => {
    expect(normalizeImageKitUploadResult({
      fileId: 'ik-file-1',
      name: '20260801-foto-kegiatan.webp',
      filePath: '/hmte/galeri/20260801-foto-kegiatan.webp',
      url: 'https://ik.imagekit.io/hmte/foto-kegiatan.webp',
      thumbnailUrl: 'https://ik.imagekit.io/hmte/tr:n-thumb/foto-kegiatan.webp',
      width: 1600,
      height: 900,
      size: 1024,
    }, fallbackFile, 'galeri')).toEqual({
      fileId: 'ik-file-1',
      fileName: '20260801-foto-kegiatan.webp',
      filePath: '/hmte/galeri/20260801-foto-kegiatan.webp',
      url: 'https://ik.imagekit.io/hmte/foto-kegiatan.webp',
      thumbnailUrl: 'https://ik.imagekit.io/hmte/tr:n-thumb/foto-kegiatan.webp',
      width: 1600,
      height: 900,
      size: 1024,
      mimeType: 'image/webp',
    })
  })

  it('tetap menerima field `fileName` lama dan membuat fallback aman', () => {
    expect(normalizeImageKitUploadResult({
      fileId: 'ik-file-2',
      fileName: 'foto-lama.webp',
      url: 'https://ik.imagekit.io/hmte/foto-lama.webp',
    }, fallbackFile, 'situs')).toMatchObject({
      fileName: 'foto-lama.webp',
      filePath: '/hmte/situs/foto-lama.webp',
      thumbnailUrl: 'https://ik.imagekit.io/hmte/foto-lama.webp',
      size: 2048,
      mimeType: 'image/webp',
    })
  })

  it('tetap menolak respons yang benar-benar tidak memiliki identitas', () => {
    expect(() => normalizeImageKitUploadResult({
      fileId: 'ik-file-3',
      url: 'https://ik.imagekit.io/hmte/tanpa-nama.webp',
    }, fallbackFile, 'berita')).toThrow('ImageKit tidak mengembalikan identitas gambar yang lengkap.')
  })
})
