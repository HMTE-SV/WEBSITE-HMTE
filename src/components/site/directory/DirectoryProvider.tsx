'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { DivisionCode, Leader } from '@/types/content'

export type ActiveMember = {
  leader: Leader
  divisionCode: DivisionCode
  divisionName: string
}

type DirectoryContextValue = {
  selectedDivision: DivisionCode
  directoryStage: 'idle' | 'confirming' | 'open'
  transitionKey: number
  selectDivision: (code: DivisionCode, options?: { scroll?: boolean }) => void
  activeMember: ActiveMember | null
  openMember: (member: ActiveMember) => void
  closeMember: () => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

/**
 * Shares the leadership directory's interactive state across the sections that
 * read it: the kabinet cards select a bidang and scroll into the directory, the
 * directory renders the selection, and the modal opens member detail. Replaces
 * the old global eval-script + DOM-id glue with a single React source of truth.
 */
export function DirectoryProvider({
  children,
  initialDivision = 'PH',
}: {
  children: ReactNode
  initialDivision?: DivisionCode
}) {
  const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(initialDivision)
  const [directoryStage, setDirectoryStage] = useState<'idle' | 'confirming' | 'open'>('idle')
  const [transitionKey, setTransitionKey] = useState(0)
  const [activeMember, setActiveMember] = useState<ActiveMember | null>(null)
  const openTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (openTimer.current !== null) {
        window.clearTimeout(openTimer.current)
      }
    },
    [],
  )

  const selectDivision = useCallback((code: DivisionCode, options?: { scroll?: boolean }) => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
    }

    setSelectedDivision(code)
    setActiveMember(null)
    setDirectoryStage('confirming')
    setTransitionKey((current) => current + 1)

    if (options?.scroll && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('division-reveal')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    openTimer.current = window.setTimeout(
      () => {
        setDirectoryStage('open')
        openTimer.current = null
      },
      prefersReducedMotion ? 0 : 860,
    )
  }, [])

  const openMember = useCallback((member: ActiveMember) => setActiveMember(member), [])
  const closeMember = useCallback(() => setActiveMember(null), [])

  const value = useMemo<DirectoryContextValue>(
    () => ({
      selectedDivision,
      directoryStage,
      transitionKey,
      selectDivision,
      activeMember,
      openMember,
      closeMember,
    }),
    [
      selectedDivision,
      directoryStage,
      transitionKey,
      selectDivision,
      activeMember,
      openMember,
      closeMember,
    ],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const context = useContext(DirectoryContext)

  if (!context) {
    throw new Error('useDirectory must be used within a DirectoryProvider')
  }

  return context
}
