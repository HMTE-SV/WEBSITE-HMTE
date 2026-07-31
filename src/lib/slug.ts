export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Versi longgar untuk dipakai saat mengetik: karakter tak valid tetap dibersihkan,
// tetapi satu tanda hubung di akhir dipertahankan supaya slug multi-kata bisa diketik.
export function normalizeSlugInput(value: string) {
  const core = slugify(value)
  const endsWithSeparator = value.length > 0 && !/[a-z0-9]$/i.test(value)

  return core && endsWithSeparator ? `${core}-` : core
}

export function createUniqueSlug(value: string, takenSlugs: Iterable<string> = []) {
  const baseSlug = slugify(value)
  const existingSlugs = new Set(takenSlugs)

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug
  }

  let count = 2
  let nextSlug = `${baseSlug}-${count}`

  while (existingSlugs.has(nextSlug)) {
    count += 1
    nextSlug = `${baseSlug}-${count}`
  }

  return nextSlug
}
