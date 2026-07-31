import { describe, expect, it } from 'vitest'
import {
  getDefaultPageContent,
  interpolatePageText,
  normalizePageContent,
  pageField,
} from './page-content'

describe('page content registry', () => {
  it('builds complete defaults for every registered page', () => {
    const home = getDefaultPageContent('home')
    const contact = getDefaultPageContent('contact')
    expect(home.sections.map((section) => section.id)).toEqual(['hero', 'about', 'news', 'organization', 'momentum', 'cta'])
    expect(contact.sections.map((section) => section.id)).toEqual(['hero', 'channels', 'postscript'])
    expect(pageField(home, 'cta', 'primaryHref')).toBe('/aspirasi')
  })

  it('merges partial documents with defaults and ignores unknown media slots', () => {
    const content = normalizePageContent({
      sections: [{ id: 'news', visible: false, order: 1, fields: { emptyTitle: 'Belum ada kabar' } }],
      mediaAssignments: { 'home.hero.1': 'media-1', 'unknown.slot': 'media-2' },
    }, 'home')
    expect(pageField(content, 'news', 'emptyTitle')).toBe('Belum ada kabar')
    expect(pageField(content, 'news', 'kicker')).toBe('Ruang kabar HMTE')
    expect(content.sections.find((section) => section.id === 'news')?.visible).toBe(false)
    expect(content.mediaAssignments).toEqual({ 'home.hero.1': 'media-1' })
  })

  it('keeps locked hero first while preserving movable section order', () => {
    const content = normalizePageContent({ sections: [
      { id: 'hero', order: 99 },
      { id: 'cta', order: 0 },
      { id: 'about', order: 5 },
    ] }, 'home')
    expect(content.sections[0].id).toBe('hero')
    expect(content.sections[1].id).toBe('cta')
  })

  it('preserves intentionally empty editorial fields', () => {
    const content = normalizePageContent({ sections: [{ id: 'cta', fields: { channelLabel: '' } }] }, 'home')
    expect(pageField(content, 'cta', 'channelLabel')).toBe('')
  })

  it('interpolates known placeholders and removes unknown ones safely', () => {
    expect(interpolatePageText('Periode {{period}} · {{missing}}', { period: '2026/2027' })).toBe('Periode 2026/2027 · ')
  })
})
