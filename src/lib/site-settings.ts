import { agendaYear as localAgendaYear } from '@/data/site-content'

export const siteChannelKeys = ['instagram', 'email', 'website', 'linkedin', 'x'] as const
export type SiteChannelKey = (typeof siteChannelKeys)[number]

export type SiteNavigationLink = {
  id: string
  label: string
  href: string
  visible: boolean
}

export type SiteNavigationItem = SiteNavigationLink & {
  children: SiteNavigationLink[]
}

export type SiteFooterLink = SiteNavigationLink & {
  channel: SiteChannelKey | ''
  newTab: boolean
}

export type SiteFooterColumn = {
  id: string
  title: string
  visible: boolean
  links: SiteFooterLink[]
}

export type SiteSettings = {
  siteName: string
  organizationName: string
  programName: string
  facultyName: string
  universityName: string
  cabinetName: string
  periodLabel: string
  agendaYear: number
  tagline: string
  instagram: string
  email: string
  website: string
  linkedin: string
  x: string
  address: string
  closingCheer: string
  headerCtaLabel: string
  headerCtaHref: string
  navigation: SiteNavigationItem[]
  footerMastheadNote: string
  footerMastheadSubnote: string
  footerColumns: SiteFooterColumn[]
  siteUrl: string
  siteTitle: string
  siteDescription: string
  locale: string
}

const defaultNavigation: SiteNavigationItem[] = [
  { id: 'home', label: 'Beranda', href: '/', visible: true, children: [] },
  { id: 'about', label: 'Tentang HMTE', href: '/#tentang', visible: true, children: [] },
  {
    id: 'organization', label: 'Organisasi', href: '#', visible: true,
    children: [
      { id: 'leadership', label: 'Kepengurusan', href: '/kepengurusan', visible: true },
      { id: 'programs', label: 'Program Kerja', href: '/program-kerja', visible: true },
    ],
  },
  {
    id: 'news', label: 'Kabar', href: '#', visible: true,
    children: [
      { id: 'articles', label: 'Berita', href: '/berita', visible: true },
      { id: 'agenda', label: 'Agenda', href: '/agenda', visible: true },
      { id: 'announcements', label: 'Pengumuman', href: '/pengumuman', visible: true },
      { id: 'gallery', label: 'Galeri', href: '/galeri', visible: true },
    ],
  },
  {
    id: 'connect', label: 'Terhubung', href: '#', visible: true,
    children: [
      { id: 'aspiration', label: 'Aspirasi', href: '/aspirasi', visible: true },
      { id: 'contact', label: 'Kontak', href: '/kontak', visible: true },
    ],
  },
]

const defaultFooterColumns: SiteFooterColumn[] = [
  {
    id: 'organization', title: 'Organisasi', visible: true,
    links: [
      { id: 'about', label: 'Tentang', href: '/#tentang', visible: true, channel: '', newTab: false },
      { id: 'leadership', label: 'Kepengurusan', href: '/kepengurusan', visible: true, channel: '', newTab: false },
      { id: 'programs', label: 'Program Kerja', href: '/program-kerja', visible: true, channel: '', newTab: false },
    ],
  },
  {
    id: 'students', title: 'Mahasiswa', visible: true,
    links: [
      { id: 'articles', label: 'Berita', href: '/berita', visible: true, channel: '', newTab: false },
      { id: 'agenda', label: 'Agenda', href: '/agenda', visible: true, channel: '', newTab: false },
      { id: 'announcements', label: 'Pengumuman', href: '/pengumuman', visible: true, channel: '', newTab: false },
      { id: 'gallery', label: 'Galeri', href: '/galeri', visible: true, channel: '', newTab: false },
    ],
  },
  {
    id: 'contact', title: 'Kontak', visible: true,
    links: [
      { id: 'instagram', label: '@hmteugm', href: '', visible: true, channel: 'instagram', newTab: true },
      { id: 'website', label: 'hmte.ugm.ac.id', href: '', visible: true, channel: 'website', newTab: true },
      { id: 'aspiration', label: 'Aspirasi mahasiswa', href: '/aspirasi', visible: true, channel: '', newTab: false },
      { id: 'contact-page', label: 'Halaman kontak', href: '/kontak', visible: true, channel: '', newTab: false },
    ],
  },
]

export const defaultSiteSettings: SiteSettings = {
  address: 'Program Studi Teknologi Rekayasa Elektro · Sekolah Vokasi UGM',
  agendaYear: localAgendaYear,
  cabinetName: 'Abya Vistara',
  closingCheer: 'ELEKTRO... SATU!!!',
  email: 'hmte.svugm@gmail.com',
  facultyName: 'Sekolah Vokasi',
  footerColumns: defaultFooterColumns,
  footerMastheadNote: 'Situs resmi Himpunan Mahasiswa Teknik Elektro',
  footerMastheadSubnote: 'Sekolah Vokasi, Universitas Gadjah Mada',
  headerCtaHref: '/kontak',
  headerCtaLabel: 'Hubungi',
  instagram: 'hmteugm',
  linkedin: '',
  locale: 'id_ID',
  navigation: defaultNavigation,
  organizationName: 'Himpunan Mahasiswa Teknik Elektro',
  periodLabel: '2026/2027',
  programName: 'Teknologi Rekayasa Elektro',
  siteDescription: 'Website HMTE TRE SV UGM sebagai rumah informasi organisasi, kegiatan mahasiswa, program kerja, prestasi, galeri, alumni, dan kolaborasi.',
  siteName: 'HMTE TRE SV UGM',
  siteTitle: 'HMTE TRE SV UGM - Elektro... Satu!!!',
  siteUrl: 'https://website-hmte.vercel.app',
  tagline: 'Rumah bertumbuh yang nyaman, inovatif, dan produktif untuk berkembang bersama serta memberi dampak lebih luas.',
  universityName: 'Universitas Gadjah Mada',
  website: 'https://hmte.ugm.ac.id',
  x: '',
}

function pickText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function pickOptionalText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function pickBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeHref(value: unknown, fallback: string) {
  const href = pickOptionalText(value, fallback)
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href) ? href : fallback
}

function normalizeId(value: unknown, fallback: string) {
  const id = pickOptionalText(value, fallback).replace(/[^a-z0-9_-]/gi, '-').slice(0, 80)
  return id || fallback
}

function normalizeNavigationLink(raw: unknown, fallback: SiteNavigationLink, index: number): SiteNavigationLink {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    id: normalizeId(record.id, `${fallback.id || 'link'}-${index + 1}`),
    label: pickText(record.label, fallback.label),
    href: normalizeHref(record.href, fallback.href),
    visible: pickBoolean(record.visible, fallback.visible),
  }
}

function normalizeNavigation(value: unknown): SiteNavigationItem[] {
  if (!Array.isArray(value)) return defaultNavigation

  return value.slice(0, 12).map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const fallback = defaultNavigation[index] ?? {
      id: `navigation-${index + 1}`, label: 'Menu', href: '/', visible: true, children: [],
    }
    const children = Array.isArray(record.children)
      ? record.children.slice(0, 12).map((child, childIndex) => normalizeNavigationLink(
          child,
          fallback.children[childIndex] ?? { id: `child-${childIndex + 1}`, label: 'Tautan', href: '/', visible: true },
          childIndex,
        ))
      : fallback.children

    return { ...normalizeNavigationLink(record, fallback, index), children }
  })
}

function normalizeFooterLink(raw: unknown, fallback: SiteFooterLink, index: number): SiteFooterLink {
  const record = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const channel = siteChannelKeys.includes(record.channel as SiteChannelKey)
    ? record.channel as SiteChannelKey
    : ''

  return {
    ...normalizeNavigationLink(record, fallback, index),
    channel,
    newTab: pickBoolean(record.newTab, fallback.newTab),
  }
}

function normalizeFooterColumns(value: unknown): SiteFooterColumn[] {
  if (!Array.isArray(value)) return defaultFooterColumns

  return value.slice(0, 6).map((column, index) => {
    const record = column && typeof column === 'object' ? column as Record<string, unknown> : {}
    const fallback = defaultFooterColumns[index] ?? {
      id: `footer-${index + 1}`, title: 'Kolom', visible: true, links: [],
    }
    const links = Array.isArray(record.links)
      ? record.links.slice(0, 12).map((link, linkIndex) => normalizeFooterLink(
          link,
          fallback.links[linkIndex] ?? {
            id: `footer-link-${linkIndex + 1}`, label: 'Tautan', href: '/', visible: true, channel: '', newTab: false,
          },
          linkIndex,
        ))
      : fallback.links

    return {
      id: normalizeId(record.id, fallback.id),
      title: pickText(record.title, fallback.title),
      visible: pickBoolean(record.visible, fallback.visible),
      links,
    }
  })
}

export function normalizeInstagramHandle(value: string) {
  return value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/+$/, '')
}

export function normalizeSiteSettings(raw: Record<string, unknown> | null | undefined): SiteSettings {
  if (!raw) return defaultSiteSettings

  const year = Number(raw.agendaYear)
  return {
    address: pickText(raw.address, defaultSiteSettings.address),
    agendaYear: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : defaultSiteSettings.agendaYear,
    cabinetName: pickText(raw.cabinetName, defaultSiteSettings.cabinetName),
    closingCheer: pickText(raw.closingCheer, defaultSiteSettings.closingCheer),
    email: pickText(raw.email, defaultSiteSettings.email),
    facultyName: pickText(raw.facultyName, defaultSiteSettings.facultyName),
    footerColumns: normalizeFooterColumns(raw.footerColumns),
    footerMastheadNote: pickText(raw.footerMastheadNote, defaultSiteSettings.footerMastheadNote),
    footerMastheadSubnote: pickText(raw.footerMastheadSubnote, defaultSiteSettings.footerMastheadSubnote),
    headerCtaHref: normalizeHref(raw.headerCtaHref, defaultSiteSettings.headerCtaHref),
    headerCtaLabel: pickText(raw.headerCtaLabel, defaultSiteSettings.headerCtaLabel),
    instagram: normalizeInstagramHandle(pickText(raw.instagram, defaultSiteSettings.instagram)),
    linkedin: normalizeHref(raw.linkedin, defaultSiteSettings.linkedin),
    locale: pickText(raw.locale, defaultSiteSettings.locale),
    navigation: normalizeNavigation(raw.navigation),
    organizationName: pickText(raw.organizationName, defaultSiteSettings.organizationName),
    periodLabel: pickText(raw.periodLabel, defaultSiteSettings.periodLabel),
    programName: pickText(raw.programName, defaultSiteSettings.programName),
    siteDescription: pickText(raw.siteDescription, defaultSiteSettings.siteDescription),
    siteName: pickText(raw.siteName, defaultSiteSettings.siteName),
    siteTitle: pickText(raw.siteTitle, defaultSiteSettings.siteTitle),
    siteUrl: normalizeHref(raw.siteUrl, defaultSiteSettings.siteUrl),
    tagline: pickText(raw.tagline, defaultSiteSettings.tagline),
    universityName: pickText(raw.universityName, defaultSiteSettings.universityName),
    website: normalizeHref(raw.website, defaultSiteSettings.website),
    x: normalizeHref(raw.x, defaultSiteSettings.x),
  }
}

export function formatCabinetTitle(settings: SiteSettings) {
  return `Kabinet ${settings.cabinetName}`
}

export function formatPeriodTitle(settings: SiteSettings) {
  return `Periode ${settings.periodLabel}`
}

export function instagramUrl(settings: SiteSettings) {
  return `https://www.instagram.com/${settings.instagram}`
}

export function instagramLabel(settings: SiteSettings) {
  return `@${settings.instagram}`
}

export function channelHref(settings: SiteSettings, channel: SiteChannelKey) {
  if (channel === 'instagram') return instagramUrl(settings)
  if (channel === 'email') return `mailto:${settings.email}`
  return settings[channel]
}

export function resolveFooterHref(settings: SiteSettings, link: SiteFooterLink) {
  return link.channel ? channelHref(settings, link.channel) : link.href
}
