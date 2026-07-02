import type { DivisionCode, Leader, Program } from '@/types/content'

export function toOrganizationSlug(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getDivisionHref(code: DivisionCode) {
  return `/divisi/${toOrganizationSlug(code)}`
}

export function getLeaderHref(leader: Pick<Leader, 'name'>) {
  return `/pengurus/${toOrganizationSlug(leader.name)}`
}

export function getProgramHref(program: Pick<Program, 'name'>) {
  return `/program-kerja/${toOrganizationSlug(program.name)}`
}
