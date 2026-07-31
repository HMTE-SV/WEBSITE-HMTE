import { mediaSlotDefinitions } from '@/data/media-slots'
import type { MediaSlotDocument } from '@/types/firestore'

export type ResolvedMediaSlot = {
  key: string
  isAssigned: boolean
  url: string
  alt: string
  width: number | null
  height: number | null
  focalPointX: number
  focalPointY: number
}

export type ResolvedMediaSlotMap = Record<string, ResolvedMediaSlot>

function clampFocalPoint(value: number | undefined) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? Number(value) : 50))
}

export function resolveMediaSlots(
  storedSlots: Array<Partial<MediaSlotDocument>> = [],
): ResolvedMediaSlotMap {
  const byKey = new Map(
    storedSlots.flatMap((slot) => {
      const key = slot.slotKey || slot.id
      return key ? [[key, slot] as const] : []
    }),
  )

  return Object.fromEntries(
    mediaSlotDefinitions.map((definition) => {
      const stored = byKey.get(definition.key)
      const assignedUrl = stored?.mediaUrl?.trim() || ''
      const usesAssignedMedia = Boolean(assignedUrl)

      return [
        definition.key,
        {
          key: definition.key,
          isAssigned: usesAssignedMedia,
          url: assignedUrl || definition.fallbackUrl,
          alt: usesAssignedMedia
            ? stored?.mediaAlt?.trim() || definition.fallbackAlt
            : definition.fallbackAlt,
          width: usesAssignedMedia && Number(stored?.mediaWidth) > 0
            ? Number(stored?.mediaWidth)
            : null,
          height: usesAssignedMedia && Number(stored?.mediaHeight) > 0
            ? Number(stored?.mediaHeight)
            : null,
          focalPointX: usesAssignedMedia ? clampFocalPoint(stored?.focalPointX) : 50,
          focalPointY: usesAssignedMedia ? clampFocalPoint(stored?.focalPointY) : 50,
        },
      ]
    }),
  )
}

export const fallbackMediaSlots = resolveMediaSlots()
