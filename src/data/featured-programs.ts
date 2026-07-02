import type { DivisionCode } from '@/types/content'

export const featuredProgramNamesByDivision = {
  PH: 'Rapat Kerja Himpunan',
  KOMINFO: 'Portal Website HMTE',
  IPTEK: 'Workshop Embedded & IoT',
  PSDM: 'Kaderisasi & Evaluasi',
  PHAL: 'Company Visit',
  MINKAT: 'Electro Art Night',
  KASTRAD: 'Electro Speak Up',
  KEWIRUS: 'Electro Store',
} satisfies Record<DivisionCode, string>

export function isFeaturedProgram(divisionCode: DivisionCode, programName: string) {
  return featuredProgramNamesByDivision[divisionCode] === programName
}

