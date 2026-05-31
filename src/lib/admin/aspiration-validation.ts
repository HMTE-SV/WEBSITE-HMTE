type AspirationInput = {
  category: string
  isAnonymous: boolean
  message: string
  senderEmail: string
  senderName: string
}

type ValidationResult = {
  errors: string[]
  success: boolean
}

export const aspirationCategories = ['akademik', 'fasilitas', 'organisasi', 'kesejahteraan', 'lainnya'] as const

export function validateAspirationInput(input: AspirationInput): ValidationResult {
  const errors: string[] = []

  if (!input.category.trim()) {
    errors.push('Kategori aspirasi wajib dipilih.')
  }

  if (input.message.trim().length < 20) {
    errors.push('Isi aspirasi minimal 20 karakter.')
  }

  if (!input.isAnonymous && !input.senderName.trim()) {
    errors.push('Nama wajib diisi jika tidak anonim.')
  }

  return {
    success: errors.length === 0,
    errors,
  }
}
