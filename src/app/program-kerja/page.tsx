import type { Metadata } from 'next'
import { ProgramCatalog } from '@/components/site/ProgramCatalog'
import { ProgramYearStage } from '@/components/site/ProgramYearStage'
import { PublicPageFrame } from '@/components/site/PublicPage'
import { leadershipDivisionOrder } from '@/data/divisions'
import { getOrganizationData } from '@/lib/organization-data'
import { getSiteSettings } from '@/lib/site-settings-data'

/*
 * Jaring pengaman, bukan jalur utama.
 *
 * Jalur normalnya panel memanggil /api/revalidate begitu data berubah, jadi
 * halaman ini segar dalam hitungan detik. Tanpa `revalidate`, halaman ini
 * statis penuh dan panggilan itu jadi SATU-SATUNYA cara menyegarkannya: sekali
 * gagal (token kedaluwarsa, 401, jaringan pengurus putus), halamannya basi
 * sampai deploy berikutnya, bukan sampai lima menit berikutnya.
 */
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Program Kerja HMTE TRE SV UGM',
  description:
    'Papan tahun program kerja HMTE TRE SV UGM: 37 program, delapan bidang, dua belas bulan.',
}

/*
 * Halaman ini punya dua babak, dan keduanya sengaja tidak sama.
 *
 * Babak pertama adalah PAPAN: medan gelap selebar layar tempat satu periode
 * kerja digambar sebagai delapan pita waktu. Ia menjawab pertanyaan yang selama
 * ini tidak pernah bisa dijawab situs ini, yaitu kapan himpunan ini sibuk dan
 * siapa yang sedang memikulnya. Itu bukan sesuatu yang bisa dibaca dari daftar
 * mana pun.
 *
 * Babak kedua adalah INDEKS: permukaan terang berisi katalog yang bisa dicari
 * dan disaring. Ia menjawab pertanyaan yang berbeda, yaitu "di mana program yang
 * sedang saya cari".
 *
 * Tiga versi sebelumnya gagal karena mencoba menjawab keduanya dengan satu
 * bahasa visual yang sama, dan hasilnya empat blok kartu yang tidak bisa
 * dibedakan satu sama lain.
 *
 * Bagian sorotan yang dulu berdiri sendiri sebagai tiga kartu berwarna dibuang.
 * Papan sudah menandai program sorotan dengan titik emas di tempatnya berada di
 * garis waktu, dan itu keterangan yang lebih berguna daripada tiga kartu yang
 * mengulang isi katalog di bawahnya.
 */
export default async function ProgramsPage() {
  const { divisionsByCode, programsByDivision } = await getOrganizationData()
  const { agendaYear: year } = await getSiteSettings()

  const divisions = leadershipDivisionOrder.flatMap((code) => {
    const division = divisionsByCode[code]
    return division ? [division] : []
  })

  return (
    <PublicPageFrame activeHref="/program-kerja">
      <ProgramYearStage divisions={divisions} programsByDivision={programsByDivision} year={year} />

      <section className="soft-surface" aria-labelledby="catalog-title">
        <div className="soft-shell">
          <ProgramCatalog divisions={divisions} programsByDivision={programsByDivision} year={year} />
        </div>
      </section>
    </PublicPageFrame>
  )
}
