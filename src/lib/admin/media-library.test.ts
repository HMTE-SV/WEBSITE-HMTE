import { describe, expect, it } from 'vitest'
import { buildMediaDocument, filterPickerMedia, getMediaDocumentId, mediaMatchesSearch } from './media-library'
import type { MediaDocument } from '@/types/firestore'

describe('media library', () => {
  it('builds a reusable media record from ImageKit output', () => {
    const record = buildMediaDocument(
      {
        fileId: 'file-1',
        fileName: 'rapat.webp',
        filePath: '/hmte/situs/rapat.webp',
        url: 'https://ik.imagekit.io/hmte/rapat.webp',
        thumbnailUrl: 'https://ik.imagekit.io/hmte/tr:n-media_library_thumbnail/rapat.webp',
        width: 1600,
        height: 900,
        size: 120000,
        mimeType: 'image/webp',
      },
      { name: 'Rapat Besar.webp', size: 120000, type: 'image/webp' },
      'situs',
      { alt: ' Pengurus sedang rapat ', consentStatus: 'confirmed' },
    )

    expect(record.alt).toBe('Pengurus sedang rapat')
    expect(record.originalFileName).toBe('Rapat Besar.webp')
    expect(record.focalPointX).toBe(50)
  })

  it('searches across filename and editorial metadata', () => {
    const media = {
      fileName: 'foto.webp',
      originalFileName: 'DSC001.webp',
      alt: 'Pelatihan solder',
      caption: '',
      credit: 'KOMINFO',
      folder: 'galeri',
    } as MediaDocument

    expect(mediaMatchesSearch(media, 'solder')).toBe(true)
    expect(mediaMatchesSearch(media, 'kominfo')).toBe(true)
    expect(mediaMatchesSearch(media, 'wisuda')).toBe(false)
  })

  it('turns ImageKit ids into safe Firestore document ids', () => {
    expect(getMediaDocumentId('folder/file:01')).toBe('folder_file_01')
  })

  it('filters picker results by category and caps the initial result', () => {
    const media = Array.from({ length: 30 }, (_, index) => ({
      id: `media-${index}`,
      status: 'active',
      folder: index < 26 ? 'galeri' : 'situs',
      fileName: `foto-${index}.webp`,
      originalFileName: `Foto ${index}.webp`,
      alt: `Dokumentasi ${index}`,
      caption: '',
      credit: '',
    })) as MediaDocument[]
    const result = filterPickerMedia(media, { folder: 'galeri', query: '', limit: 12 })
    expect(result.total).toBe(26)
    expect(result.items).toHaveLength(12)
    expect(result.items.every((item) => item.folder === 'galeri')).toBe(true)
  })
})
