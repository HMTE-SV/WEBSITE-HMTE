import { describe, expect, it } from 'vitest'
import { canAccessAdminPath, canAdminWrite, getAdminNavItemsForRole } from './admin-nav'

describe('admin access control', () => {
  it('limits settings navigation to superadmin', () => {
    expect(getAdminNavItemsForRole('superadmin').some((item) => item.href === '/admin/settings')).toBe(true)
    expect(getAdminNavItemsForRole('editor').some((item) => item.href === '/admin/settings')).toBe(false)
    expect(getAdminNavItemsForRole('viewer').some((item) => item.href === '/admin/settings')).toBe(false)
  })

  it('allows editors to open content forms but keeps settings private', () => {
    expect(canAccessAdminPath('editor', '/admin/articles/new')).toBe(true)
    expect(canAccessAdminPath('editor', '/admin/articles/document-id')).toBe(true)
    expect(canAccessAdminPath('editor', '/admin/settings')).toBe(false)
  })

  it('keeps viewers on read-only admin routes', () => {
    expect(canAccessAdminPath('viewer', '/admin/articles')).toBe(true)
    expect(canAccessAdminPath('viewer', '/admin/articles/new')).toBe(false)
    expect(canAccessAdminPath('viewer', '/admin/articles/document-id')).toBe(false)
    expect(canAdminWrite('viewer')).toBe(false)
  })

  it('rejects unknown admin paths by default', () => {
    expect(canAccessAdminPath('superadmin', '/admin/unknown')).toBe(false)
  })
})
