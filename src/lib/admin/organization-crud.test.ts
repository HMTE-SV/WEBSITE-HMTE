import { describe, expect, it } from 'vitest'
import {
  buildOrganizationPayload,
  formatProgramMonths,
  getEmptyOrganizationFormValues,
  organizationCrudConfigs,
  organizationDocumentToFormValues,
  parseProgramMonths,
} from './organization-crud'
import type { ProgramDocument } from '@/types/firestore'

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
      programStatus: 'Berkala',
      months: '6, 9',
      order: '4',
      active: false,
    })

    expect(payload).toMatchObject({
      name: 'Workshop IoT',
      divisionCode: 'IPTEK',
      status: 'Berkala',
      months: [6, 9],
      order: 4,
      active: false,
    })
  })
})

describe('program months', () => {
  it('parses, sorts, and de-duplicates the month input', () => {
    expect(parseProgramMonths('12, 3, 6, 3')).toEqual([3, 6, 12])
  })

  it('drops values outside 1-12 so the agenda grid cannot be drawn wrong', () => {
    expect(parseProgramMonths('0, 5, 13, -2, abc, 12')).toEqual([5, 12])
  })

  it('treats an empty input as no months rather than as a zero', () => {
    expect(parseProgramMonths('')).toEqual([])
    expect(parseProgramMonths('   ')).toEqual([])
  })

  it('round-trips a program document back into the form without losing months', () => {
    const document = {
      id: 'sotm',
      name: 'SOTM',
      desc: 'Agenda SOTM.',
      divisionCode: 'PH',
      status: 'Berkala',
      date: 'Maret, Juni, September, dan Desember',
      months: [3, 6, 9, 12],
      active: true,
      order: 3,
    } satisfies ProgramDocument

    const values = organizationDocumentToFormValues('programs', document)
    expect(values.months).toBe('3, 6, 9, 12')

    const payload = buildOrganizationPayload('programs', values)
    expect(payload).toMatchObject({ months: [3, 6, 9, 12] })
  })

  it('survives legacy documents saved before months existed', () => {
    expect(formatProgramMonths(undefined)).toBe('')
  })
})
