import { describe, expect, it } from 'vitest'
import { validateAspirationInput } from './aspiration-validation'

describe('aspiration validation', () => {
  it('rejects empty category and message', () => {
    const result = validateAspirationInput({
      category: '',
      isAnonymous: false,
      message: '',
      senderEmail: '',
      senderName: '',
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Kategori aspirasi wajib dipilih.')
    expect(result.errors).toContain('Isi aspirasi minimal 20 karakter.')
  })

  it('allows anonymous aspiration without sender identity', () => {
    const result = validateAspirationInput({
      category: 'akademik',
      isAnonymous: true,
      message: 'Mohon ditambah sesi diskusi akademik setelah praktikum.',
      senderEmail: '',
      senderName: '',
    })

    expect(result).toEqual({
      success: true,
      errors: [],
    })
  })
})
