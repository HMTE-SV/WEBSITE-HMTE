import { divisions as localDivisions } from '@/data/divisions'
import { leadersByDivision as localLeadersByDivision } from '@/data/leaders'
import { programsByDivision as localProgramsByDivision } from '@/data/programs'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments } from '@/lib/firebase/content-services'
import type { Division, DivisionCode, Leader, Program } from '@/types/content'
import type { DivisionDocument, LeaderDocument, ProgramDocument } from '@/types/firestore'

export type OrganizationData = {
  divisions: Division[]
  divisionsByCode: Record<DivisionCode, Division>
  leadersByDivision: Record<DivisionCode, Leader[]>
  programsByDivision: Record<DivisionCode, Program[]>
}

function buildDivisionsByCode(divisions: Division[]) {
  return Object.fromEntries(divisions.map((division) => [division.code, division])) as Record<DivisionCode, Division>
}

export function getLocalOrganizationData(): OrganizationData {
  return {
    divisions: localDivisions,
    divisionsByCode: buildDivisionsByCode(localDivisions),
    leadersByDivision: localLeadersByDivision,
    programsByDivision: localProgramsByDivision,
  }
}

function emptyDivisionRecord<T>() {
  const record: Record<DivisionCode, T[]> = {
    PH: [],
    KOMINFO: [],
    IPTEK: [],
    PSDM: [],
    PHAL: [],
    MINKAT: [],
    KASTRAD: [],
    KEWIRUS: [],
  }

  return record
}

export async function getOrganizationData(): Promise<OrganizationData> {
  if (!hasFirebaseConfig()) {
    return getLocalOrganizationData()
  }

  try {
    const [divisionDocuments, leaderDocuments, programDocuments] = await Promise.all([
      listContentDocuments<DivisionDocument>('divisions'),
      listContentDocuments<LeaderDocument>('leaders'),
      listContentDocuments<ProgramDocument>('programs'),
    ])

    const divisions = divisionDocuments
      .filter((division) => division.active)
      .sort((first, second) => first.order - second.order)
      .map((division) => ({
        code: division.code,
        description: division.description,
        name: division.name,
        order: division.order,
        shortName: division.shortName,
      }))

    if (divisions.length === 0) {
      console.warn(
        '[organization-data] Firebase terkonfigurasi tetapi tidak ada divisi aktif di Firestore — memakai data lokal sebagai fallback.',
      )
      return getLocalOrganizationData()
    }

    const leadersByDivision = emptyDivisionRecord<Leader>()
    const programsByDivision = emptyDivisionRecord<Program>()

    leaderDocuments
      .filter((leader) => leader.active && leader.divisionCode)
      .sort((first, second) => first.order - second.order)
      .forEach((leader) => {
        leadersByDivision[leader.divisionCode || 'PH'].push({
          bio: leader.bio,
          email: leader.email,
          instagram: leader.instagram,
          linkedin: leader.linkedin,
          name: leader.name,
          photo: leader.photo,
          role: leader.role,
        })
      })

    programDocuments
      .filter((program) => program.active)
      .sort((first, second) => first.order - second.order)
      .forEach((program) => {
        programsByDivision[program.divisionCode].push({
          date: program.date,
          desc: program.desc,
          name: program.name,
          status: program.status,
        })
      })

    return {
      divisions,
      divisionsByCode: buildDivisionsByCode(divisions),
      leadersByDivision,
      programsByDivision,
    }
  } catch (error) {
    console.warn(
      '[organization-data] Gagal mengambil data dari Firestore — memakai data lokal sebagai fallback.',
      error,
    )
    return getLocalOrganizationData()
  }
}
