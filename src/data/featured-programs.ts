import type { DivisionCode } from '@/types/content'

export const featuredProgramNamesByDivision: Partial<Record<DivisionCode, string>> = {
  PSDM: 'TORSI',
  IPTEK: 'HMTE Mengajar',
  MINKAT: 'Elektro Cup',
}

export function isFeaturedProgram(divisionCode: DivisionCode, programName: string) {
  return featuredProgramNamesByDivision[divisionCode] === programName
}
