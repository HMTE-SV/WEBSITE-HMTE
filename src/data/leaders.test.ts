import { describe, expect, it } from 'vitest'
import { leadersByDivision } from './leaders'

describe('anggota HMTE roster', () => {
  it('normalizes the source roster into unique member profiles', () => {
    const members = Object.values(leadersByDivision).flat()

    expect(members).toHaveLength(71)
    expect(new Set(members.map((member) => member.name)).size).toBe(71)
  })

  it('never carries the NIM out of the roster file', () => {
    const members = Object.values(leadersByDivision).flat()

    expect(members.some((member) => 'studentId' in member)).toBe(false)
  })

  it('keeps the stronger structural role when a member is duplicated as staff', () => {
    expect(
      leadersByDivision.KEWIRUS.find((member) => member.name === 'Ahmad Syafiq Fadhilah')?.role,
    ).toBe('Bendahara')
    expect(
      leadersByDivision.PHAL.find((member) => member.name === 'Muhamad Alif Ihsan')?.role,
    ).toBe('Sekretaris 1')
  })

  it('preserves both distinct IPTEK heads listed in the source', () => {
    // Two heads share the same role priority, so their relative order is just
    // the locale tie-break — assert membership, not sequence.
    const heads = leadersByDivision.IPTEK.filter(
      (member) => member.role === 'Kepala Divisi',
    ).map((member) => member.name)

    expect(heads).toHaveLength(2)
    expect(new Set(heads)).toEqual(new Set(['Ibnu Rafi Farabi', 'I Made Reeyza']))
  })
})
