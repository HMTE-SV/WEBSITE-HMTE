import { cache } from 'react'
import { where } from 'firebase/firestore'
import { divisions as localDivisions } from '@/data/divisions'
import { leadersByDivision as localLeadersByDivision } from '@/data/leaders'
import { programsByDivision as localProgramsByDivision } from '@/data/programs'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments } from '@/lib/firebase/content-services'
import { normalizeProgramMonths } from '@/lib/program-schedule'
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

/**
 * Melengkapi pengurus dari Firestore dengan field yang cuma ada di roster.
 *
 * Yang menentukan SIAPA saja pengurusnya adalah Firestore, titik. Roster
 * `ASSET/anggota-hmte.md` hanya boleh mengisi kolom yang kosong milik orang yang
 * sudah ada di Firestore.
 *
 * Dulu fungsi ini menggabungkan kedua sumber sebagai gabungan himpunan, dan
 * akibatnya menghapus pengurus dari basis data tidak berpengaruh apa pun di
 * situs: namanya masuk lagi dari roster pada render berikutnya. Penghapusan yang
 * tidak pernah sampai ke publik lebih berbahaya daripada kolom angkatan yang
 * kosong, jadi arahnya sekarang satu jalan saja.
 */
function enrichLeadersFromRoster(
  localLeaders: Record<DivisionCode, Leader[]>,
  remoteLeaders: Record<DivisionCode, Leader[]>,
) {
  const enriched = emptyDivisionRecord<Leader>()

  Object.keys(enriched).forEach((rawCode) => {
    const code = rawCode as DivisionCode
    const roster = new Map(
      localLeaders[code].map((leader) => [leader.name.toLocaleLowerCase('id-ID'), leader]),
    )

    enriched[code] = remoteLeaders[code].map((leader) => {
      const fromRoster = roster.get(leader.name.toLocaleLowerCase('id-ID'))

      return {
        ...leader,
        batch: leader.batch || fromRoster?.batch,
        photo: leader.photo || fromRoster?.photo || '',
      }
    })
  })

  return enriched
}

export const getOrganizationData = cache(async function getOrganizationData(): Promise<OrganizationData> {
  if (!hasFirebaseConfig()) {
    return getLocalOrganizationData()
  }

  try {
    const [divisionDocuments, leaderDocuments, programDocuments] = await Promise.all([
      listContentDocuments<DivisionDocument>('divisions', [where('active', '==', true)]),
      listContentDocuments<LeaderDocument>('leaders', [where('active', '==', true)]),
      listContentDocuments<ProgramDocument>('programs', [where('active', '==', true)]),
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
        // `email` sengaja TIDAK disalin. Tidak ada satu pun halaman publik yang
        // merendernya, tapi apa pun yang masuk objek ini ikut terserialisasi ke
        // payload RSC dan terbaca di source HTML. Alasannya sama persis dengan
        // catatan tentang NIM di src/types/content.ts: tidak dirender bukan
        // berarti tidak terkirim. Panel admin tetap bisa membaca dan mengubah
        // email karena ia membaca dokumen Firestore langsung, bukan lewat sini.
        leadersByDivision[leader.divisionCode || 'PH'].push({
          batch: leader.batch,
          bio: leader.bio,
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
          // startDate/endDate wajib ikut disalin di sini. Field yang ada di
          // dokumen tapi tidak disalin akan hilang diam-diam begitu data pindah
          // ke Firestore, dan halaman publik jatuh ke keadaan "belum
          // dijadwalkan" tanpa error apa pun. Itu persis yang pernah terjadi
          // pada `months` (temuan F1 di docs/RENCANA_ADMIN_PANEL.md).
          endDate: program.endDate,
          months: normalizeProgramMonths(program.months),
          name: program.name,
          startDate: program.startDate,
          status: program.status,
        })
      })

    return {
      divisions,
      divisionsByCode: buildDivisionsByCode(divisions),
      leadersByDivision: enrichLeadersFromRoster(localLeadersByDivision, leadersByDivision),
      programsByDivision,
    }
  } catch (error) {
    console.warn(
      '[organization-data] Gagal mengambil data dari Firestore — memakai data lokal sebagai fallback.',
      error,
    )
    return getLocalOrganizationData()
  }
})
