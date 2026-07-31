import { describe, expect, it } from 'vitest'
import { defaultSiteSettings } from '@/lib/site-settings'
import { validateSiteSettings } from './site-settings-validation'

describe('validateSiteSettings', () => {
  it('menerima pengaturan bawaan', () => {
    expect(validateSiteSettings(defaultSiteSettings).success).toBe(true)
  })

  it('menahan publish untuk SEO, tombol, dan tautan yang tidak valid', () => {
    const result = validateSiteSettings({
      ...defaultSiteSettings,
      headerCtaHref: 'javascript:alert(1)',
      siteTitle: 'x'.repeat(66),
      siteUrl: '/bukan-url-penuh',
    })

    expect(result.success).toBe(false)
    expect(result.issues.some((issue) => issue.tab === 'header')).toBe(true)
    expect(result.issues.filter((issue) => issue.tab === 'seo')).toHaveLength(2)
  })

  it('hanya mewajibkan URL sendiri ketika tautan footer tidak mengikuti kanal', () => {
    const result = validateSiteSettings({
      ...defaultSiteSettings,
      footerColumns: [{
        id: 'contact', title: 'Kontak', visible: true,
        links: [{ id: 'instagram', label: 'Instagram', href: '', visible: true, channel: 'instagram', newTab: true }],
      }],
    })

    expect(result.success).toBe(true)
  })
})
