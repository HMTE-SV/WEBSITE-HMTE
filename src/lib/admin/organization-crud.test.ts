import { describe, expect, it } from 'vitest'
import { buildOrganizationPayload, getEmptyOrganizationFormValues, organizationCrudConfigs } from './organization-crud'

describe('admin organization CRUD helpers', () => {
  it('maps organization configs to Firestore collections', () => {
    expect(organizationCrudConfigs.leaders.collectionName).toBe('leaders')
    expect(organizationCrudConfigs.divisions.collectionName).toBe('divisions')
    expect(organizationCrudConfigs.programs.collectionName).toBe('programs')
  })

  it('builds a leader payload with active status and order', () => {
    const payload = buildOrganizationPayload('leaders', {
      ...getEmptyOrganizationFormValues('leaders'),
      name: 'Reyhan',
      role: 'Ketua Himpunan',
      divisionCode: 'PH',
      order: '2',
      active: true,
    })

    expect(payload).toMatchObject({
      name: 'Reyhan',
      role: 'Ketua Himpunan',
      divisionCode: 'PH',
      order: 2,
      active: true,
    })
  })

  it('builds a program payload with sorting and active status', () => {
    const payload = buildOrganizationPayload('programs', {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Workshop IoT',
      desc: 'Pelatihan embedded system.',
      date: 'Juni 2026',
      divisionCode: 'IPTEK',
      programStatus: 'Sedang Berjalan',
      order: '4',
      active: false,
    })

    expect(payload).toMatchObject({
      name: 'Workshop IoT',
      divisionCode: 'IPTEK',
      status: 'Sedang Berjalan',
      order: 4,
      active: false,
    })
  })
})
