'use client'

import { createContext, useContext, type ReactNode } from 'react'
import {
  fallbackMediaSlots,
  type ResolvedMediaSlot,
  type ResolvedMediaSlotMap,
} from '@/lib/media-slot-resolver'

const MediaSlotContext = createContext<ResolvedMediaSlotMap>(fallbackMediaSlots)

export function MediaSlotProvider({
  children,
  slots,
}: {
  children: ReactNode
  slots: ResolvedMediaSlotMap
}) {
  return <MediaSlotContext.Provider value={slots}>{children}</MediaSlotContext.Provider>
}

export function useMediaSlot(key: string): ResolvedMediaSlot {
  return useContext(MediaSlotContext)[key] ?? fallbackMediaSlots[key]
}

export function useMediaSlots(keys: readonly string[]): ResolvedMediaSlot[] {
  const slots = useContext(MediaSlotContext)
  return keys.map((key) => slots[key] ?? fallbackMediaSlots[key])
}
