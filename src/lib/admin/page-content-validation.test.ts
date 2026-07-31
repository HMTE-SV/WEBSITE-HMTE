import { describe, expect, it } from 'vitest'
import { getDefaultPageContent } from '@/lib/page-content'
import { isValidEditorialUrl, validatePageContent } from './page-content-validation'

describe('page content validation', () => {
  it('accepts internal paths, anchors, and safe web URLs', () => {
    expect(isValidEditorialUrl('/kontak')).toBe(true)
    expect(isValidEditorialUrl('#kabar')).toBe(true)
    expect(isValidEditorialUrl('https://hmte.ugm.ac.id')).toBe(true)
    expect(isValidEditorialUrl('javascript:alert(1)')).toBe(false)
  })

  it('accepts complete default page content', () => {
    expect(validatePageContent(getDefaultPageContent('home'))).toEqual({ issues: [], success: true })
    expect(validatePageContent(getDefaultPageContent('contact'))).toEqual({ issues: [], success: true })
  })

  it('rejects empty visible fields, invalid URLs, and oversized SEO', () => {
    const content = getDefaultPageContent('home')
    content.seoTitle = 'x'.repeat(66)
    const cta = content.sections.find((section) => section.id === 'cta')!
    cta.fields.titleLine1 = ''
    cta.fields.primaryHref = 'javascript:alert(1)'
    const result = validatePageContent(content)
    expect(result.success).toBe(false)
    expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
      'seoTitle', 'cta.titleLine1', 'cta.primaryHref',
    ]))
  })

  it('allows incomplete fields inside hidden sections', () => {
    const content = getDefaultPageContent('home')
    const cta = content.sections.find((section) => section.id === 'cta')!
    cta.visible = false
    cta.fields.titleLine1 = ''
    expect(validatePageContent(content).issues.some((issue) => issue.panelId === 'cta')).toBe(false)
  })
})
