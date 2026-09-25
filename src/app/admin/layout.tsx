/*
 * Sistem desain panel admin (docs/DESIGN_ADMIN.md). Dilingkupi `.adm`, jadi ia
 * hidup berdampingan dengan admin-panel.css lama selama halaman dipindahkan
 * satu per satu. Berkas lama dibuang begitu tidak ada lagi yang memakainya.
 *
 * Diimpor di sini, bukan di root layout: halaman publik tidak memakai satu pun
 * kelas `.adm`/`.adp`, dan ±4.000 baris CSS yang ikut terunduh di setiap
 * halaman publik ikut memblokir render pertama di HP.
 */
import '../../../css/admin.css'
import '../../../css/admin-dashboard.css'
import '../../../css/admin-publikasi.css'
import '../../../css/admin-organisasi.css'

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
