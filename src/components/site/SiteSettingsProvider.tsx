'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings'

const SiteSettingsContext = createContext<SiteSettings>(defaultSiteSettings)

export function SiteSettingsProvider({ children, settings }: { children: ReactNode; settings: SiteSettings }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
