export const publicDataCategories = [
  { value: 'kemahasiswaan', label: 'Kemahasiswaan', description: 'Direktori, rekap, dan informasi mahasiswa.' },
  { value: 'penugasan', label: 'Penugasan', description: 'Pembagian tugas, progres, dan hasil kegiatan.' },
  { value: 'akademik', label: 'Akademik', description: 'Data pendukung kegiatan belajar dan pengembangan.' },
  { value: 'organisasi', label: 'Organisasi', description: 'Data kerja, pemantauan, dan dokumentasi organisasi.' },
  { value: 'lainnya', label: 'Lainnya', description: 'Data publik lain yang bermanfaat bagi mahasiswa.' },
] as const

export type PublicDataCategory = (typeof publicDataCategories)[number]['value']
export type PublicDataResourceKind = 'spreadsheet' | 'file' | 'link'

export type PublicDataResource = {
  id: string
  label: string
  description: string
  kind: PublicDataResourceKind
  url: string
  format: string
  fileId?: string
  fileName?: string
  mimeType?: string
  size?: number
}

export const publicDataResourceKindLabels: Record<PublicDataResourceKind, string> = {
  spreadsheet: 'Spreadsheet',
  file: 'Berkas unggahan',
  link: 'Tautan eksternal',
}

const allowedResourceKinds = new Set<PublicDataResourceKind>(['spreadsheet', 'file', 'link'])
const allowedFileExtensions = new Set(['pdf', 'csv', 'xlsx', 'xls', 'ods', 'docx', 'doc', 'pptx', 'ppt', 'zip'])
const MAX_PUBLIC_DATA_FILE_SIZE = 15 * 1024 * 1024

function pickText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeHttpsUrl(value: unknown) {
  const url = pickText(value)
  if (!url.startsWith('https://')) return ''
  try {
    return new URL(url).toString()
  } catch {
    return ''
  }
}

export function getPublicDataCategoryLabel(category: PublicDataCategory) {
  return publicDataCategories.find((item) => item.value === category)?.label ?? 'Data publik'
}

export function makePublicDataResourceId() {
  return `resource-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeEmptyPublicDataResource(): PublicDataResource {
  return {
    id: makePublicDataResourceId(),
    label: '',
    description: '',
    kind: 'spreadsheet',
    url: '',
    format: '',
  }
}

export function normalizePublicDataResources(value: unknown): PublicDataResource[] {
  if (!Array.isArray(value)) return []

  return value.slice(0, 24).flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const kind = allowedResourceKinds.has(record.kind as PublicDataResourceKind)
      ? record.kind as PublicDataResourceKind
      : 'link'
    const label = pickText(record.label)
    const url = safeHttpsUrl(record.url)
    if (!label || !url) return []

    return [{
      id: pickText(record.id) || `resource-${index + 1}`,
      label,
      description: pickText(record.description),
      kind,
      url,
      format: pickText(record.format).slice(0, 16),
      fileId: pickText(record.fileId) || undefined,
      fileName: pickText(record.fileName) || undefined,
      mimeType: pickText(record.mimeType) || undefined,
      size: Number.isFinite(Number(record.size)) ? Math.max(0, Number(record.size)) : undefined,
    }]
  })
}

export function validatePublicDataFile(file: Pick<File, 'name' | 'size'>) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const errors: string[] = []
  if (!allowedFileExtensions.has(extension)) {
    errors.push('Format berkas belum didukung. Gunakan PDF, CSV, Excel, Word, PowerPoint, ODS, atau ZIP.')
  }
  if (file.size <= 0) errors.push('Berkas kosong tidak dapat diunggah.')
  if (file.size > MAX_PUBLIC_DATA_FILE_SIZE) errors.push('Ukuran berkas maksimal 15 MB.')
  return { errors, success: errors.length === 0 }
}

export function validatePublicDataResources(resources: PublicDataResource[]) {
  const errors: string[] = []
  if (resources.length > 24) errors.push('Maksimal 24 resource dalam satu halaman data.')

  resources.forEach((resource, index) => {
    const label = `Resource ${index + 1}`
    if (!resource.label.trim()) errors.push(`${label}: judul wajib diisi.`)
    if (!safeHttpsUrl(resource.url)) errors.push(`${label}: tautan wajib berupa HTTPS yang sah.`)
    if (!allowedResourceKinds.has(resource.kind)) errors.push(`${label}: jenis resource tidak dikenal.`)
  })

  return errors
}
