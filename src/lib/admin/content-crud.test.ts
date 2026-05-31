import { describe, expect, it } from 'vitest'
import { buildContentPayload, contentCrudConfigs, getNextPublishStatus } from './content-crud'

describe('admin content CRUD helpers', () => {
  it('maps collection config to admin routes', () => {
    expect(contentCrudConfigs.announcements.basePath).toBe('/admin/announcements')
    expect(contentCrudConfigs.events.collectionName).toBe('events')
    expect(contentCrudConfigs.articles.newPath).toBe('/admin/articles/new')
  })

  it('builds an article payload with generated slug when slug is empty', () => {
    const payload = buildContentPayload('articles', {
      title: 'Workshop Embedded & IoT',
      excerpt: 'Ringkasan artikel.',
      date: '',
      status: 'draft',
      body: '',
      location: '',
      slug: '',
      category: 'pendidikan',
      content: 'Isi artikel lengkap.',
      coverImage: '',
    })

    expect(payload).toMatchObject({
      title: 'Workshop Embedded & IoT',
      slug: 'workshop-embedded-dan-iot',
      status: 'draft',
      category: 'pendidikan',
    })
  })

  it('toggles publish status between draft and published', () => {
    expect(getNextPublishStatus('draft')).toBe('published')
    expect(getNextPublishStatus('archived')).toBe('published')
    expect(getNextPublishStatus('published')).toBe('draft')
  })
})
