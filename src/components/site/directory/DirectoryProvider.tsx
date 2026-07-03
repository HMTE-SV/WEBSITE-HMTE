'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { DivisionCode } from '@/types/content'

type DirectoryContextValue = {
  selectedDivision: DivisionCode
  selectDivision: (code: DivisionCode, options?: { scroll?: boolean }) => void
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

  const selectDivision = useCallback((code: DivisionCode, options?: { scroll?: boolean }) => {
    setSelectedDivision(code)

    if (options?.scroll && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        document
          .getElementById('division-showcase')
          ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
      })
    }
  }, [])

  const value = useMemo(() => ({ selectedDivision, selectDivision }), [selectedDivision, selectDivision])

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>
}

export function useDirectory() {
  const context = useContext(DirectoryContext)

  if (!context) throw new Error('useDirectory must be used within a DirectoryProvider')

  return context
}
