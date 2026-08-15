import { describe, expect, it } from 'vitest'
import { buildContentPayload, contentCrudConfigs, getEmptyContentFormValues, getNextPublishStatus } from './content-crud'

describe('admin content CRUD helpers', () => {
  it('maps collection config to admin routes', () => {
    expect(contentCrudConfigs.announcements.basePath).toBe('/admin/announcements')
    expect(contentCrudConfigs.announcements.collectionName).toBe('announcements')
    expect(contentCrudConfigs.articles.newPath).toBe('/admin/articles/new')
  })

  it('builds an article payload with generated slug when slug is empty', () => {
    const payload = buildContentPayload('articles', {
      title: 'Workshop Embedded & IoT',
      excerpt: 'Ringkasan artikel.',
      date: '',
      status: 'draft',
      body: '',
      slug: '',
      category: 'pendidikan',
      content: 'Isi artikel lengkap.',
      coverImage: '',
      dataCategory: 'kemahasiswaan',
      period: '',
      publisher: 'HMTE TRE SV UGM',
      relatedProgram: 'Website HMTE',
      showArticleMeta: false,
      showDataMeta: true,
      resources: [],
    })

    expect(payload).toMatchObject({
      title: 'Workshop Embedded & IoT',
      slug: 'workshop-embedded-dan-iot',
      status: 'draft',
      category: 'pendidikan',
      publisher: 'HMTE TRE SV UGM',
      relatedProgram: 'Website HMTE',
      showArticleMeta: false,
    })
  })

  it('shows article metadata by default while allowing each article to hide it', () => {
    expect(getEmptyContentFormValues('articles').showArticleMeta).toBe(true)
  })

  it('builds a public data payload with resources', () => {
    const payload = buildContentPayload('publicData', {
      title: 'Data Mahasiswa TRE 25', excerpt: 'Direktori mahasiswa.', date: '', status: 'published',
      body: '', slug: '', category: '', content: '<p>Penjelasan data.</p>', coverImage: '',
      dataCategory: 'kemahasiswaan', period: 'TRE 25', resources: [{
        id: 'resource-1', label: 'Spreadsheet utama', description: '', kind: 'spreadsheet',
        url: 'https://docs.google.com/spreadsheets/d/example', format: 'SHEETS',
      }],
      publisher: '', relatedProgram: '', showArticleMeta: true,
      showDataMeta: false,
    })

    expect(payload).toMatchObject({
      slug: 'data-mahasiswa-tre-25',
      category: 'kemahasiswaan',
      period: 'TRE 25',
      showDataMeta: false,
    })
  })

  it('shows data metadata by default while allowing each page to hide it', () => {
    expect(getEmptyContentFormValues('publicData').showDataMeta).toBe(true)
  })

  it('toggles publish status between draft and published', () => {
    expect(getNextPublishStatus('draft')).toBe('published')
    expect(getNextPublishStatus('archived')).toBe('published')
    expect(getNextPublishStatus('published')).toBe('draft')
  })
})
