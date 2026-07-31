import { cache } from 'react'
import { where } from 'firebase/firestore'
import { divisions as localDivisions } from '@/data/divisions'
import { leadersByDivision as localLeadersByDivision } from '@/data/leaders'
import { programsByDivision as localProgramsByDivision } from '@/data/programs'
import { hasFirebaseConfig } from '@/lib/firebase/client'
import { listContentDocuments } from '@/lib/firebase/content-services'
import {
  normalizeProgramCoordinators,
  normalizeProgramObjectives,
  normalizeProgramResources,
  normalizeProgramTimeline,
} from '@/lib/program-detail'
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

/*
 * Kapan boleh diam-diam mundur ke data seed lokal, dan kapan harus berisik.
 *
 * Halaman organisasi sekarang statis dengan ISR. Artinya hasil satu kali
 * pembacaan Firestore bisa terpanggang jadi HTML yang dilayani berhari-hari.
 * Kalau pembacaan itu gagal lalu kita diam-diam memakai seed lokal, situs
 * menerbitkan susunan pengurus lama tanpa satu pun tanda, dan tidak pernah
 * pulih sendiri: orang yang sudah dihapus di panel muncul kembali di publik.
 * Itu persis mode kegagalan yang membuat Ibnu bertahan di situs.
 *
 * Jadi di produksi kita melempar. Saat build, build-nya gagal dan tidak ada
 * yang salah yang terbit. Saat revalidasi ISR, Next mempertahankan versi
 * terakhir yang baik lalu mencoba lagi. Dua-duanya lebih jujur daripada
 * menerbitkan data yang keliru.
 *
 * Di pengembangan kita tetap mundur, supaya jaringan yang putus tidak
 * menghentikan pekerjaan tata letak. Peringatannya dinaikkan ke console.error
 * biar tidak tenggelam.
 */
function handleOrganizationFetchFailure(reason: string, error?: unknown): OrganizationData {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`[organization-data] ${reason}`, error ? { cause: error } : undefined)
  }

  console.error(`[organization-data] ${reason} Memakai data seed lokal karena ini mode pengembangan.`, error)
  return getLocalOrganizationData()
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

    /*
     * Nol divisi bukan keadaan yang sah, dan bukan error yang dilempar
     * Firestore. Rules yang menolak baca mengembalikan array kosong, bukan
     * pengecualian, jadi tanpa penjagaan ini rules yang belum di-deploy tampil
     * sebagai situs yang datanya hilang diam-diam.
     */
    if (divisions.length === 0) {
      return handleOrganizationFetchFailure(
        'Firebase terkonfigurasi tetapi tidak ada satu pun divisi aktif. Kemungkinan firestore.rules belum di-deploy, atau database belum di-seed.',
      )
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
          coordinators: normalizeProgramCoordinators(program.coordinators),
          date: program.date,
          desc: program.desc,
          // startDate/endDate wajib ikut disalin di sini. Field yang ada di
          // dokumen tapi tidak disalin akan hilang diam-diam begitu data pindah
          // ke Firestore, dan halaman publik jatuh ke keadaan "belum
          // dijadwalkan" tanpa error apa pun. Itu persis yang pernah terjadi
          // pada `months` (temuan F1 di docs/RENCANA_ADMIN_PANEL.md), dan
          // alasan yang sama berlaku untuk seluruh isi rincian di bawah.
          endDate: program.endDate,
          featured: program.featured === true,
          months: normalizeProgramMonths(program.months),
          name: program.name,
          objectives: normalizeProgramObjectives(program.objectives),
          resources: normalizeProgramResources(program.resources),
          startDate: program.startDate,
          status: program.status,
          summary: typeof program.summary === 'string' ? program.summary.trim() : '',
          timeline: normalizeProgramTimeline(program.timeline),
        })
      })

    return {
      divisions,
      divisionsByCode: buildDivisionsByCode(divisions),
      leadersByDivision: enrichLeadersFromRoster(localLeadersByDivision, leadersByDivision),
      programsByDivision,
    }
  } catch (error) {
    return handleOrganizationFetchFailure('Gagal membaca Firestore.', error)
  }
})
