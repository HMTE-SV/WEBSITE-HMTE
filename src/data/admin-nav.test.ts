import { describe, expect, it } from 'vitest'
import { canAccessAdminPath, canAdminWrite, getAdminNavItemsForRole } from './admin-nav'

describe('admin access control', () => {
  it('limits settings navigation to superadmin', () => {
    expect(getAdminNavItemsForRole('superadmin').some((item) => item.href === '/admin/settings')).toBe(true)
    expect(getAdminNavItemsForRole('editor').some((item) => item.href === '/admin/settings')).toBe(false)
    expect(getAdminNavItemsForRole('viewer').some((item) => item.href === '/admin/settings')).toBe(false)
  })

  it('gives a new operator only the two baseline modules', () => {
    const hrefs = getAdminNavItemsForRole('editor').map((item) => item.href)
    expect(hrefs).toContain('/admin/media')
    expect(hrefs).toContain('/admin/programs')
    expect(hrefs).not.toContain('/admin/data')
    expect(hrefs).not.toContain('/admin/downloads')
  })

  it('opens a module only after it is assigned', () => {
    expect(canAccessAdminPath('editor', '/admin/data/new')).toBe(false)
    expect(canAccessAdminPath('editor', '/admin/data/new', ['publicData'])).toBe(true)
    expect(canAccessAdminPath('editor', '/admin/downloads', ['publicData'])).toBe(false)
    expect(canAccessAdminPath('editor', '/admin/settings')).toBe(false)
  })

  it('keeps viewers on read-only admin routes', () => {
    expect(canAccessAdminPath('viewer', '/admin/articles')).toBe(true)
    expect(canAccessAdminPath('viewer', '/admin/articles/new')).toBe(false)
    expect(canAccessAdminPath('viewer', '/admin/articles/document-id')).toBe(false)
    expect(canAccessAdminPath('viewer', '/admin/data/document-id')).toBe(false)
    expect(canAccessAdminPath('viewer', '/admin/pages/home')).toBe(true)
    expect(canAdminWrite('viewer')).toBe(false)
  })

  it('rejects unknown admin paths by default', () => {
    expect(canAccessAdminPath('superadmin', '/admin/unknown')).toBe(false)
  })
})
