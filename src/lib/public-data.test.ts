import { describe, expect, it } from 'vitest'
import { normalizePublicDataResources, validatePublicDataResources } from './public-data'

describe('public data resources', () => {
  it('keeps only valid HTTPS resources', () => {
    expect(normalizePublicDataResources([
      { id: 'one', label: 'Spreadsheet', kind: 'spreadsheet', url: 'https://docs.google.com/spreadsheets/d/example' },
      { id: 'two', label: 'Tidak aman', kind: 'link', url: 'javascript:alert(1)' },
    ])).toHaveLength(1)
  })

  it('rejects incomplete resources before publishing', () => {
    expect(validatePublicDataResources([{
      id: 'one', label: '', description: '', kind: 'spreadsheet', url: 'http://example.com', format: '',
    }])).toEqual([
      'Resource 1: judul wajib diisi.',
      'Resource 1: tautan wajib berupa HTTPS yang sah.',
    ])
  })
})
