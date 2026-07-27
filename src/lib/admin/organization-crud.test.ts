import { describe, expect, it } from 'vitest'
import {
  buildOrganizationPayload,
  formatProgramMonths,
  getEmptyOrganizationFormValues,
  organizationCrudConfigs,
  organizationDocumentToFormValues,
  parseProgramMonths,
  toggleProgramMonth,
  validateOrganizationValues,
  type OrganizationFormValues,
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
      months: [6, 9],
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
    expect(values.months).toEqual([3, 6, 9, 12])

    const payload = buildOrganizationPayload('programs', values)
    expect(payload).toMatchObject({ months: [3, 6, 9, 12] })
  })

  it('survives legacy documents saved before months existed', () => {
    expect(formatProgramMonths(undefined)).toBe('')
    expect(organizationDocumentToFormValues('programs', {
      id: 'legacy',
      name: 'Program lama',
      desc: '',
      divisionCode: 'PH',
      status: 'Terjadwal',
      date: 'Belum ditentukan',
      months: [],
      active: true,
      order: 1,
    } satisfies ProgramDocument)).toMatchObject({ months: [], startDate: '', endDate: '' })
  })
})

describe('twelve-box month picker', () => {
  it('adds a month and keeps the list sorted', () => {
    expect(toggleProgramMonth([9, 3], 6)).toEqual([3, 6, 9])
  })

  it('removes a month that was already selected', () => {
    expect(toggleProgramMonth([3, 6, 9], 6)).toEqual([3, 9])
  })
})

describe('program schedule validation', () => {
  function programValues(overrides: Partial<OrganizationFormValues> = {}) {
    return {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Workshop IoT',
      ...overrides,
    }
  }

  it('rejects an end date that falls before the start date', () => {
    const result = validateOrganizationValues('programs', programValues({
      startDate: '2026-03-14',
      endDate: '2026-03-12',
    }))

    expect(result.errors).toContain('Tanggal selesai lebih awal daripada tanggal mulai.')
  })

  it('accepts a single-day activity that only has a start date', () => {
    const result = validateOrganizationValues('programs', programValues({ startDate: '2026-03-14' }))
    expect(result.errors).toEqual([])
  })

  it('rejects an end date with no start date to anchor it', () => {
    const result = validateOrganizationValues('programs', programValues({ endDate: '2026-03-14' }))
    expect(result.errors.some((message) => message.includes('butuh tanggal mulai'))).toBe(true)
  })

  it('rejects a date that does not exist even though Date would roll it over', () => {
    const result = validateOrganizationValues('programs', programValues({ startDate: '2026-02-30' }))
    expect(result.errors.some((message) => message.includes('Tanggal mulai tidak valid'))).toBe(true)
  })

  it('warns without blocking when the program falls outside the board year', () => {
    const result = validateOrganizationValues('programs', programValues({ startDate: '2027-03-14' }))

    expect(result.errors).toEqual([])
    expect(result.warnings.some((message) => message.includes('di luar tahun papan'))).toBe(true)
  })

  it('warns when a program has neither a month nor a date', () => {
    const result = validateOrganizationValues('programs', programValues())

    expect(result.errors).toEqual([])
    expect(result.warnings.some((message) => message.includes('tidak muncul di peta'))).toBe(true)
  })

  it('requires a name on every kind', () => {
    expect(validateOrganizationValues('leaders', {
      ...getEmptyOrganizationFormValues('leaders'),
      name: '   ',
    }).errors).toContain('Nama wajib diisi.')
  })
})

describe('program payload derived from the schedule', () => {
  it('adds the start date month to the planned months', () => {
    const payload = buildOrganizationPayload('programs', {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Diesnatalis',
      months: [9],
      startDate: '2026-03-14',
    })

    expect(payload).toMatchObject({ months: [3, 9], startDate: '2026-03-14' })
  })

  it('derives the human-readable label when none was typed', () => {
    const payload = buildOrganizationPayload('programs', {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Diesnatalis',
      startDate: '2026-03-14',
      endDate: '2026-03-16',
    })

    expect(payload.date).toBe('14-16 Maret 2026')
  })

  it('keeps a manually typed label instead of overwriting it', () => {
    const payload = buildOrganizationPayload('programs', {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Kaderisasi',
      date: 'Menyesuaikan kalender akademik',
      months: [8],
    })

    expect(payload.date).toBe('Menyesuaikan kalender akademik')
  })

  it('writes cleared dates as empty strings so they can actually be cleared', () => {
    const payload = buildOrganizationPayload('programs', {
      ...getEmptyOrganizationFormValues('programs'),
      name: 'Program batal tanggal',
      months: [5],
    })

    expect(payload.startDate).toBe('')
    expect(payload.endDate).toBe('')
  })
})
