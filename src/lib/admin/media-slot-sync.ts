import {
  getContentDocument,
  listContentDocuments,
  updateContentDocument,
} from '@/lib/firebase/content-services'
import type { MediaDocument, MediaSlotDocument } from '@/types/firestore'

export function buildPublicMediaProjection(media: MediaDocument | null | undefined) {
  const isActive = media?.status === 'active'

  return {
    mediaUrl: isActive ? media.url : '',
    mediaAlt: isActive ? media.alt : '',
    mediaWidth: isActive ? media.width : 0,
    mediaHeight: isActive ? media.height : 0,
    focalPointX: isActive ? media.focalPointX : 50,
    focalPointY: isActive ? media.focalPointY : 50,
  }
}

export async function syncMediaSlotProjections(mediaId: string) {
  const [media, slots] = await Promise.all([
    getContentDocument<MediaDocument>('media', mediaId),
    listContentDocuments<MediaSlotDocument>('mediaSlots'),
  ])
  const affectedSlots = slots.filter((slot) => slot.mediaId === mediaId)

  await Promise.all(
    affectedSlots.map((slot) =>
      updateContentDocument<MediaSlotDocument>(
        'mediaSlots',
        slot.id,
        buildPublicMediaProjection(media),
      ),
    ),
  )

  return affectedSlots.length
}
