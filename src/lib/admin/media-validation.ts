type ImageLike = {
  name: string
  size: number
  type: string
}

type MediaValidationResult = {
  errors: string[]
  success: boolean
}

const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
const oneMb = 1024 * 1024

function validateImage(file: ImageLike, maxSize: number, maxSizeMessage: string): MediaValidationResult {
  const errors: string[] = []

  if (!supportedImageTypes.includes(file.type as (typeof supportedImageTypes)[number])) {
    errors.push('Format gambar harus JPG, PNG, atau WebP.')
  }

  if (file.size > maxSize) {
    errors.push(maxSizeMessage)
  }

  if (!file.name.trim()) {
    errors.push('Nama file tidak valid.')
  }

  return {
    success: errors.length === 0,
    errors,
  }
}

export function validateArticleCoverImage(file: ImageLike): MediaValidationResult {
  return validateImage(file, 3 * oneMb, 'Ukuran cover artikel maksimal 3MB.')
}

export function validateGalleryImage(file: ImageLike): MediaValidationResult {
  return validateImage(file, 5 * oneMb, 'Ukuran gambar galeri maksimal 5MB.')
}

export function validateGalleryImageUrl(value: string): MediaValidationResult {
  const errors: string[] = []

  try {
    const url = new URL(value)
    const supportedHosts = ['ik.imagekit.io', 'firebasestorage.googleapis.com']

    if (url.protocol !== 'https:' || !supportedHosts.includes(url.hostname)) {
      errors.push('URL gambar harus menggunakan HTTPS dari ImageKit.')
    }
  } catch {
    errors.push('URL gambar tidak valid.')
  }

  return {
    success: errors.length === 0,
    errors,
  }
}
