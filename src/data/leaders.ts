import fs from 'node:fs'
import path from 'node:path'
import type { DivisionCode, Leader } from '@/types/content'

const divisionCodes = new Set<DivisionCode>([
  'PH',
  'PSDM',
  'PHAL',
  'MINKAT',
  'KOMINFO',
  'IPTEK',
  'KEWIRUS',
  'KASTRAD',
])

const rolePriority: Record<string, number> = {
  'Ketua Umum': 100,
  'Sekretaris Jendral': 95,
  'Kepala Divisi': 90,
  Bendahara: 80,
  'Sekretaris 1': 75,
  'Sekretaris 2': 74,
  'Staff Divisi': 10,
}

function normalizeName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => {
      if (part.length === 0 || part !== part.toLowerCase()) return part
      return `${part[0].toUpperCase()}${part.slice(1)}`
    })
    .join(' ')
}

function getRolePriority(role: string) {
  return rolePriority[role] ?? 0
}

export function parseMemberRoster(source: string) {
  const memberMaps = Object.fromEntries(
    [...divisionCodes].map((code) => [code, new Map<string, Leader>()]),
  ) as Record<DivisionCode, Map<string, Leader>>

  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      // Column 2 of the roster is the NIM. It is read past and deliberately
      // dropped — nothing downstream may carry it.
      const [rawName, , rawBatch, rawDivision, rawRole] = line
        .split('\t')
        .map((value) => value.trim())
      const divisionCode = rawDivision?.toUpperCase() as DivisionCode

      if (!rawName || !rawRole || !divisionCodes.has(divisionCode)) return

      const name = normalizeName(rawName)
      const key = name.toLocaleLowerCase('id-ID')
      const candidate: Leader = {
        name,
        role: rawRole,
        photo: '',
        batch: rawBatch || undefined,
      }
      const existing = memberMaps[divisionCode].get(key)

      if (!existing || getRolePriority(candidate.role) > getRolePriority(existing.role)) {
        memberMaps[divisionCode].set(key, candidate)
      }
    })

  return Object.fromEntries(
    [...divisionCodes].map((code) => [
      code,
      [...memberMaps[code].values()].sort(
        (first, second) =>
          getRolePriority(second.role) - getRolePriority(first.role) ||
          first.name.localeCompare(second.name, 'id-ID'),
      ),
    ]),
  ) as Record<DivisionCode, Leader[]>
}

const rosterPath = path.join(process.cwd(), 'ASSET', 'anggota-hmte.md')
const rosterSource = fs.readFileSync(rosterPath, 'utf8')

export const leadersByDivision = parseMemberRoster(rosterSource)
