import { describe, expect, it } from 'vitest'
import {
  defaultDownloadsIndex,
  formatFileSize,
  isSafeDownloadPath,
  isSafePrivateDownloadPath,
  normalizeDownloadsIndex,
  redactDownloadsIndexForPublic,
  resolveDocumentVisibility,
  validateDownloadProjects,
  type DownloadProject,
} from './downloads'

const validProject: DownloadProject = {
  id: 'open-house',
  title: 'Open House 2026',
  description: 'Dokumentasi kegiatan.',
  type: 'archive',
  period: '2026',
  status: 'published',
  order: 0,
  visibility: 'public',
  hasAccessCode: false,
  documents: [{
    id: 'proposal',
    title: 'Proposal kegiatan',
    description: '',
    kind: 'file',
    path: 'assets/unduhan/proposal.pdf',
    externalUrl: '',
    format: 'PDF',
    status: 'ready',
    order: 0,
    visibility: 'public',
  }],
}

describe('normalizeDownloadsIndex', () => {
  it('dokumen tidak sah jatuh ke bawaan', () => {
    expect(normalizeDownloadsIndex(null)).toEqual(defaultDownloadsIndex)
    expect(normalizeDownloadsIndex('bukan-objek')).toEqual(defaultDownloadsIndex)
  })

  it('menormalkan dan mengurutkan project beserta dokumennya', () => {
    const result = normalizeDownloadsIndex({ projects: [
      { ...validProject, id: 'b', title: 'B', order: 2 },
      { ...validProject, id: 'a', title: 'A', order: 1, documents: [
        { ...validProject.documents[0], id: 'dua', title: 'Dua', order: 2 },
        { ...validProject.documents[0], id: 'satu', title: 'Satu', order: 1 },
      ] },
    ] })

    expect(result.projects.map((project) => project.id)).toEqual(['a', 'b'])
    expect(result.projects[0].documents.map((document) => document.id)).toEqual(['satu', 'dua'])
  })

  it('memigrasikan item lama menjadi folder arsip dan template', () => {
    const result = normalizeDownloadsIndex({ items: [
      { ...validProject.documents[0], id: 'laporan', title: 'Laporan', group: 'Open House', category: 'dokumen' },
      { ...validProject.documents[0], id: 'surat', title: 'Template surat', group: 'Administrasi', category: 'template' },
    ] })

    expect(result.projects).toHaveLength(2)
    expect(result.projects.map((project) => project.type)).toEqual(['archive', 'template'])
    expect(result.projects[0].documents[0].id).toBe('laporan')
  })

  it('project atau dokumen tanpa identitas dibuang', () => {
    const result = normalizeDownloadsIndex({ projects: [
      { id: '', title: 'Tanpa id' },
      { ...validProject, documents: [{ id: '', title: 'Tanpa id' }, validProject.documents[0]] },
    ] })
    expect(result.projects).toHaveLength(1)
    expect(result.projects[0].documents).toHaveLength(1)
  })
})

describe('isSafeDownloadPath', () => {
  it.each(['../secret', '/etc/passwd', 'C:/x', 'assets/unduhan/../../.env.local', 'public/assets/unduhan/x.pdf'])('menolak: %s', (value) => {
    expect(isSafeDownloadPath(value)).toBe(false)
  })

  it('menerima jalur sah di dalam assets/unduhan', () => {
    expect(isSafeDownloadPath('assets/unduhan/panduan.pdf')).toBe(true)
  })
})

describe('formatFileSize', () => {
  it('memakai koma dan satuan yang benar', () => {
    expect(formatFileSize(1024)).toBe('1,0 KB')
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2,5 MB')
    expect(formatFileSize(512)).toBe('512 B')
  })
})

describe('validateDownloadProjects', () => {
  it('menerima project lengkap', () => {
    expect(validateDownloadProjects([validProject])).toEqual([])
  })

  it('folder tersembunyi boleh disiapkan tanpa dokumen', () => {
    expect(validateDownloadProjects([{ ...validProject, status: 'hidden', documents: [] }])).toEqual([])
  })

  it('project terbit tidak boleh kosong', () => {
    expect(validateDownloadProjects([{ ...validProject, documents: [] }])).toContainEqual({
      projectId: 'open-house', field: 'documents', message: expect.any(String),
    })
  })

  it('menunjuk project dan dokumen yang isinya tidak sah', () => {
    const issues = validateDownloadProjects([{ ...validProject, documents: [{ ...validProject.documents[0], path: '../secret', format: '' }] }])
    expect(issues).toContainEqual({ projectId: 'open-house', documentId: 'proposal', field: 'path', message: expect.any(String) })
    expect(issues).toContainEqual({ projectId: 'open-house', documentId: 'proposal', field: 'format', message: expect.any(String) })
  })
})

describe('isSafePrivateDownloadPath', () => {
  it.each([
    'assets/unduhan/x.pdf',
    'private/arsip/../../.env.local',
    '/private/arsip/x.pdf',
    'private/arsip',
    'C:/private/arsip/x.pdf',
  ])('menolak: %s', (value) => {
    expect(isSafePrivateDownloadPath(value)).toBe(false)
  })

  it('menerima jalur sah di dalam private/arsip', () => {
    expect(isSafePrivateDownloadPath('private/arsip/open-house/laporan.pdf')).toBe(true)
  })
})

describe('resolveDocumentVisibility', () => {
  it('dokumen publik di project privat tetap privat', () => {
    expect(resolveDocumentVisibility({ visibility: 'private' }, { visibility: 'public' })).toBe('private')
  })

  it('dokumen privat di project publik tetap privat', () => {
    expect(resolveDocumentVisibility({ visibility: 'public' }, { visibility: 'private' })).toBe('private')
  })

  it('keduanya publik berarti publik', () => {
    expect(resolveDocumentVisibility({ visibility: 'public' }, { visibility: 'public' })).toBe('public')
  })
})

/*
 * Deretan uji yang paling penting di berkas ini. Fungsi ini dipanggil dari
 * browser panel admin, dan hasilnya ditulis ke dokumen yang terbaca siapa pun —
 * satu bidang yang lolos di sini berarti kebocoran permanen di produksi.
 */
describe('redactDownloadsIndexForPublic', () => {
  const privateProject: DownloadProject = {
    ...validProject,
    id: 'rahasia',
    title: 'Laporan keuangan internal',
    visibility: 'private',
    hasAccessCode: true,
    order: 1,
  }

  it('membuang project privat seluruhnya, termasuk judulnya', () => {
    const result = redactDownloadsIndexForPublic({
      projects: [validProject, privateProject],
      lockedProjects: { archive: 0, template: 0 },
      updatedBy: 'pengurus@hmte',
    })

    expect(result.projects.map((project) => project.id)).toEqual(['open-house'])
    expect(JSON.stringify(result)).not.toContain('Laporan keuangan internal')
    expect(JSON.stringify(result)).not.toContain('rahasia')
  })

  it('menghitung project privat yang terbit, bukan yang tersembunyi', () => {
    const result = redactDownloadsIndexForPublic({
      projects: [
        privateProject,
        { ...privateProject, id: 'rahasia-2', status: 'hidden' },
        { ...privateProject, id: 'rahasia-3', type: 'template' },
      ],
      lockedProjects: { archive: 0, template: 0 },
      updatedBy: '',
    })

    expect(result.lockedProjects).toEqual({ archive: 1, template: 1 })
  })

  it('dokumen privat di project publik kehilangan alamatnya tetapi tetap terdaftar', () => {
    const result = redactDownloadsIndexForPublic({
      projects: [{
        ...validProject,
        documents: [
          { ...validProject.documents[0], id: 'terbuka' },
          { ...validProject.documents[0], id: 'terkunci', title: 'Notulen rapat', visibility: 'private', path: 'private/arsip/notulen.pdf' },
          { ...validProject.documents[0], id: 'tautan', visibility: 'private', kind: 'external', path: '', externalUrl: 'https://drive.google.com/rahasia' },
        ],
      }],
      lockedProjects: { archive: 0, template: 0 },
      updatedBy: '',
    })

    const documents = result.projects[0].documents
    expect(documents.map((document) => document.id)).toEqual(['terbuka', 'terkunci', 'tautan'])
    expect(documents[1].title).toBe('Notulen rapat')
    expect(documents[1].path).toBe('')
    expect(documents[2].externalUrl).toBe('')
    expect(JSON.stringify(result)).not.toContain('drive.google.com')
    expect(JSON.stringify(result)).not.toContain('private/arsip')
  })

  it('tidak mengubah masukannya', () => {
    const master = {
      projects: [{ ...validProject, documents: [{ ...validProject.documents[0], visibility: 'private' as const, path: 'private/arsip/a.pdf' }] }],
      lockedProjects: { archive: 0, template: 0 },
      updatedBy: '',
    }
    redactDownloadsIndexForPublic(master)
    expect(master.projects[0].documents[0].path).toBe('private/arsip/a.pdf')
  })
})

describe('validateDownloadProjects — arsip privat', () => {
  it('project privat terbit tanpa kode akses ditolak', () => {
    const issues = validateDownloadProjects([{ ...validProject, visibility: 'private', hasAccessCode: false }])
    expect(issues).toContainEqual({ projectId: 'open-house', field: 'accessCode', message: expect.any(String) })
  })

  it('dokumen privat di project publik juga menuntut kode akses', () => {
    const issues = validateDownloadProjects([{
      ...validProject,
      documents: [{ ...validProject.documents[0], visibility: 'private', path: 'private/arsip/a.pdf' }],
    }])
    expect(issues).toContainEqual({ projectId: 'open-house', field: 'accessCode', message: expect.any(String) })
  })

  it('berkas privat wajib berada di luar public/', () => {
    const issues = validateDownloadProjects([{
      ...validProject,
      visibility: 'private',
      hasAccessCode: true,
      documents: [{ ...validProject.documents[0], path: 'assets/unduhan/proposal.pdf' }],
    }])
    expect(issues).toContainEqual({ projectId: 'open-house', documentId: 'proposal', field: 'path', message: expect.any(String) })
  })

  it('project privat lengkap dengan kode dan jalur yang benar diterima', () => {
    expect(validateDownloadProjects([{
      ...validProject,
      visibility: 'private',
      hasAccessCode: true,
      documents: [{ ...validProject.documents[0], path: 'private/arsip/proposal.pdf' }],
    }])).toEqual([])
  })
})
