import { describe, expect, it } from 'vitest'
import { buildAuditSummary, getChangedFields, toAuditSnapshot } from './content-audit'

describe('content audit snapshots', () => {
  it('removes system fields and undefined values recursively', () => {
    expect(toAuditSnapshot({
      id: 'abc',
      createdAt: new Date('2026-08-01T00:00:00Z'),
      title: 'Berita',
      optional: undefined,
      nested: { updatedAt: 'ignored', label: 'Tetap' },
    })).toEqual({ title: 'Berita', nested: { label: 'Tetap' } })
  })

  it('finds only top-level fields whose values changed', () => {
    expect(getChangedFields(
      { title: 'Lama', meta: { b: 2, a: 1 }, status: 'draft' },
      { title: 'Baru', meta: { a: 1, b: 2 }, status: 'draft' },
    )).toEqual(['title'])
  })

  it('builds a short Indonesian audit summary', () => {
    expect(buildAuditSummary('restore', 'articles', 'artikel-1')).toBe(
      'Memulihkan berita artikel-1',
    )
  })
})
