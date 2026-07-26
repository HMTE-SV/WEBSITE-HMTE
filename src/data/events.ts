import { programsByDivision } from '@/data/programs'
import { toOrganizationSlug } from '@/lib/organization-slugs'
import type { EventItem } from '@/types/content'

export const events: EventItem[] = Object.entries(programsByDivision)
  .flatMap(([divisionCode, programs]) =>
    programs.map((program) => ({
      id: `${divisionCode.toLowerCase()}-${toOrganizationSlug(program.name)}`,
      title: program.name,
      excerpt: program.desc,
      date: program.date,
      status: 'published' as const,
      sortMonth: program.months?.[0] ?? 13,
    })),
  )
  .sort((first, second) => first.sortMonth - second.sortMonth || first.title.localeCompare(second.title, 'id'))
  .map(({ id, title, excerpt, date, status }) => ({ id, title, excerpt, date, status }))
