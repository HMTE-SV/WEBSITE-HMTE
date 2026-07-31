import { isValidEditorialUrl } from './page-content-validation'
import type { SiteChannelKey, SiteSettings } from '@/lib/site-settings'

export type SiteSettingsValidationIssue = {
  tab: 'identity' | 'channels' | 'header' | 'footer' | 'seo'
  message: string
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function validateSiteSettings(settings: SiteSettings) {
  const issues: SiteSettingsValidationIssue[] = []
  const requireText = (value: string, label: string, tab: SiteSettingsValidationIssue['tab']) => {
    if (!value.trim()) issues.push({ tab, message: `${label} wajib diisi.` })
  }

  requireText(settings.siteName, 'Nama singkat situs', 'identity')
  requireText(settings.organizationName, 'Nama organisasi', 'identity')
  requireText(settings.programName, 'Program studi', 'identity')
  requireText(settings.universityName, 'Universitas', 'identity')
  if (!Number.isInteger(settings.agendaYear) || settings.agendaYear < 2000 || settings.agendaYear > 2200) issues.push({ tab: 'identity', message: 'Tahun agenda harus berupa tahun yang valid.' })
  requireText(settings.headerCtaLabel, 'Label tombol header', 'header')
  if (!isValidEditorialUrl(settings.headerCtaHref)) issues.push({ tab: 'header', message: 'Tujuan tombol header harus berupa path internal atau URL yang sah.' })

  for (const item of settings.navigation.filter((entry) => entry.visible)) {
    requireText(item.label, 'Label menu yang ditampilkan', 'header')
    if (!item.children.length && !isValidEditorialUrl(item.href)) issues.push({ tab: 'header', message: `Tujuan menu “${item.label || 'tanpa label'}” tidak valid.` })
    for (const child of item.children.filter((entry) => entry.visible)) {
      requireText(child.label, 'Label submenu yang ditampilkan', 'header')
      if (!isValidEditorialUrl(child.href)) issues.push({ tab: 'header', message: `Tujuan submenu “${child.label || 'tanpa label'}” tidak valid.` })
    }
  }

  for (const column of settings.footerColumns.filter((entry) => entry.visible)) {
    requireText(column.title, 'Judul kolom footer yang ditampilkan', 'footer')
    for (const link of column.links.filter((entry) => entry.visible)) {
      requireText(link.label, 'Label tautan footer yang ditampilkan', 'footer')
      if (!link.channel && !isValidEditorialUrl(link.href)) issues.push({ tab: 'footer', message: `URL footer “${link.label || 'tanpa label'}” tidak valid.` })
    }
  }

  const optionalHttpChannels: Array<[SiteChannelKey, string]> = [
    ['website', settings.website], ['linkedin', settings.linkedin], ['x', settings.x],
  ]
  for (const [channel, value] of optionalHttpChannels) {
    if (value.trim() && !isHttpUrl(value)) issues.push({ tab: 'channels', message: `URL kanal ${channel} tidak valid.` })
  }
  if (settings.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())) issues.push({ tab: 'channels', message: 'Alamat email tidak valid.' })

  requireText(settings.siteTitle, 'Judul situs', 'seo')
  if (settings.siteTitle.trim().length > 65) issues.push({ tab: 'seo', message: 'Judul situs maksimal 65 karakter.' })
  requireText(settings.siteDescription, 'Deskripsi situs', 'seo')
  if (settings.siteDescription.trim().length > 170) issues.push({ tab: 'seo', message: 'Deskripsi situs maksimal 170 karakter.' })
  if (!isHttpUrl(settings.siteUrl)) issues.push({ tab: 'seo', message: 'URL utama harus berupa URL HTTP/HTTPS lengkap.' })
  requireText(settings.locale, 'Locale Open Graph', 'seo')

  return { issues, success: issues.length === 0 }
}
