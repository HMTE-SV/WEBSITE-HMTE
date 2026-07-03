'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DivisionCode } from '@/types/content'

type DirectoryContextValue = {
  selectedDivision: DivisionCode
  selectDivision: (code: DivisionCode) => void
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null)

export function DirectoryProvider({
  children,
  initialDivision = 'PH',
}: {
  children: ReactNode
  initialDivision?: DivisionCode
}) {
  const [selectedDivision, setSelectedDivision] = useState<DivisionCode>(initialDivision)

  const value = useMemo(
    () => ({ selectedDivision, selectDivision: setSelectedDivision }),
    [selectedDivision],
  )

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const context = useContext(DirectoryContext)

  if (!context) throw new Error('useDirectory must be used within a DirectoryProvider')

  return context
}
