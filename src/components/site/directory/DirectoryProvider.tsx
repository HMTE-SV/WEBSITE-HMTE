'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DivisionCode, Leader } from '@/types/content'

export type ActiveMember = {
  leader: Leader
  divisionCode: DivisionCode
  divisionName: string
}

type DirectoryContextValue = {
  selectedDivision: DivisionCode
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
  const [activeMember, setActiveMember] = useState<ActiveMember | null>(null)

  const selectDivision = useCallback((code: DivisionCode, options?: { scroll?: boolean }) => {
    setSelectedDivision(code)

    if (options?.scroll && typeof document !== 'undefined') {
      document.getElementById('kurikulum')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  const openMember = useCallback((member: ActiveMember) => setActiveMember(member), [])
  const closeMember = useCallback(() => setActiveMember(null), [])

  const value = useMemo<DirectoryContextValue>(
    () => ({ selectedDivision, selectDivision, activeMember, openMember, closeMember }),
    [selectedDivision, selectDivision, activeMember, openMember, closeMember],
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
