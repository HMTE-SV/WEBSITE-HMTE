import { getPageDefinition, type PageContent } from '@/lib/page-content'

export type PageContentValidationIssue = {
  path: string
  panelId: string
  message: string
}

export type PageContentValidationResult = {
  issues: PageContentValidationIssue[]
  success: boolean
}

export function isValidEditorialUrl(value: string) {
  const normalized = value.trim()
  if (!normalized) return false
  if ((normalized.startsWith('/') && !normalized.startsWith('//')) || normalized.startsWith('#')) return true
  if (/^(mailto:|tel:)/i.test(normalized)) return true

  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function validatePageContent(content: PageContent): PageContentValidationResult {
  const definition = getPageDefinition(content.pageKey)
  const issues: PageContentValidationIssue[] = []
  const seoTitle = content.seoTitle.trim()
  const seoDescription = content.seoDescription.trim()

  if (!seoTitle) issues.push({ path: 'seoTitle', panelId: 'seo', message: 'Judul SEO wajib diisi.' })
  else if (seoTitle.length > 65) issues.push({ path: 'seoTitle', panelId: 'seo', message: 'Judul SEO maksimal 65 karakter.' })
  if (!seoDescription) issues.push({ path: 'seoDescription', panelId: 'seo', message: 'Deskripsi SEO wajib diisi.' })
  else if (seoDescription.length > 170) issues.push({ path: 'seoDescription', panelId: 'seo', message: 'Deskripsi SEO maksimal 170 karakter.' })

  for (const section of content.sections) {
    if (!section.visible) continue
    const sectionDefinition = definition.sections.find((item) => item.id === section.id)
    if (!sectionDefinition) continue

    for (const field of sectionDefinition.fields) {
      const value = section.fields[field.key]?.trim() ?? ''
      const path = `${section.id}.${field.key}`
      if (!value) {
        issues.push({ path, panelId: section.id, message: `${field.label} wajib diisi selama section ditampilkan.` })
        continue
      }
      if (field.type === 'url' && !isValidEditorialUrl(value)) {
        issues.push({ path, panelId: section.id, message: `${field.label} harus berupa path internal atau URL HTTP/HTTPS yang sah.` })
      }
      const maximum = field.type === 'textarea' ? 1_200 : field.type === 'url' ? 2_048 : 180
      if (value.length > maximum) {
        issues.push({ path, panelId: section.id, message: `${field.label} maksimal ${maximum.toLocaleString('id-ID')} karakter.` })
      }
    }
  }

  return { issues, success: issues.length === 0 }
}
