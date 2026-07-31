import type { ImageKitFolder, ImageKitUploadResult } from './imagekit-upload'
import {
  getContentDocument,
  writeContentDocumentAtId,
  type CreateDocumentInput,
} from '@/lib/firebase/content-services'
import type { MediaDocument } from '@/types/firestore'

export const mediaFolderLabels = {
  situs: 'Situs',
  berita: 'Berita',
  galeri: 'Galeri',
  pengurus: 'Pengurus',
} as const satisfies Record<ImageKitFolder, string>

export type MediaFolderFilter = ImageKitFolder | 'all'
export const DEFAULT_MEDIA_PICKER_LIMIT = 24

export type MediaMetadataInput = Partial<
  Pick<MediaDocument, 'alt' | 'caption' | 'credit' | 'consentStatus'>
>

export function buildMediaDocument(
  upload: ImageKitUploadResult,
  file: Pick<File, 'name' | 'size' | 'type'>,
  folder: ImageKitFolder,
  metadata: MediaMetadataInput = {},
): CreateDocumentInput<MediaDocument> {
  return {
    alt: metadata.alt?.trim() || '',
    caption: metadata.caption?.trim() || '',
    consentStatus: metadata.consentStatus || 'unknown',
    credit: metadata.credit?.trim() || '',
    fileId: upload.fileId,
    fileName: upload.fileName,
    filePath: upload.filePath,
    focalPointX: 50,
    focalPointY: 50,
    folder,
    height: upload.height,
    mimeType: upload.mimeType || file.type,
    originalFileName: file.name,
    size: upload.size || file.size,
    status: 'active',
    thumbnailUrl: upload.thumbnailUrl,
    url: upload.url,
    width: upload.width,
  }
}

export function mediaMatchesSearch(media: MediaDocument, query: string) {
  const normalized = query.trim().toLocaleLowerCase('id-ID')
  if (!normalized) return true

  return [media.fileName, media.originalFileName, media.alt, media.caption, media.credit, media.folder]
    .join(' ')
    .toLocaleLowerCase('id-ID')
    .includes(normalized)
}

export function filterPickerMedia(
  items: MediaDocument[],
  options: { folder: MediaFolderFilter; query: string; limit?: number },
) {
  const matches = items.filter((item) =>
    item.status === 'active'
    && (options.folder === 'all' || item.folder === options.folder)
    && mediaMatchesSearch(item, options.query),
  )
  const limit = options.limit ?? DEFAULT_MEDIA_PICKER_LIMIT
  return { items: matches.slice(0, limit), total: matches.length }
}

export function getMediaDocumentId(fileId: string) {
  return fileId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export async function registerUploadedMedia(
  upload: ImageKitUploadResult,
  file: Pick<File, 'name' | 'size' | 'type'>,
  folder: ImageKitFolder,
  metadata: MediaMetadataInput = {},
) {
  const id = getMediaDocumentId(upload.fileId)
  const existing = await getContentDocument<MediaDocument>('media', id)

  await writeContentDocumentAtId<MediaDocument>(
    'media',
    id,
    buildMediaDocument(upload, file, folder, metadata),
    Boolean(existing),
  )

  return { id, ...upload }
}
