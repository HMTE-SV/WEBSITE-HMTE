import { describe, expect, it } from 'vitest'
import {
  defaultDownloadsIndex,
  formatFileSize,
  isSafeDownloadPath,
  normalizeDownloadsIndex,
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
