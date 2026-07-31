import 'server-only'

import { cache } from 'react'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments } from '@/lib/firebase/content-services'
import {
  fallbackMediaSlots,
  resolveMediaSlots,
  type ResolvedMediaSlotMap,
} from '@/lib/media-slot-resolver'
import type { MediaSlotDocument } from '@/types/firestore'

export const getPublicMediaSlots = cache(async (): Promise<ResolvedMediaSlotMap> => {
  if (!hasFirebaseConfig()) return fallbackMediaSlots

  try {
    const storedSlots = await listContentDocuments<MediaSlotDocument>('mediaSlots')
    return resolveMediaSlots(storedSlots)
  } catch (error) {
    console.warn('[media-slots] Gagal membaca mediaSlots, memakai aset fallback.', error)
    return fallbackMediaSlots
  }
})
