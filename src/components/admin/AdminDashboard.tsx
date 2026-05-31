import Link from 'next/link'
import { AdminLogoutButton } from './AdminLogoutButton'
import { adminRoles } from '@/types/admin'

const dashboardCards = [
  {
    label: 'Auth',
    value: 'Aktif',
    body: 'Sesi Firebase Authentication sudah dipakai untuk menjaga area admin.',
  },
  {
    label: 'Konten',
    value: 'Menunggu CRUD',
    body: 'Pengumuman, agenda, dan berita akan dikelola pada phase CRUD berikutnya.',
  },
  {
    label: 'Role',
    value: adminRoles.length.toString(),
    body: `Model role awal: ${adminRoles.join(', ')}.`,
  },
]

export function AdminDashboard() {
  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div>
          <span className="admin-kicker">HMTE TRE SV UGM</span>
          <h1>Admin</h1>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" aria-current="page">
            Dashboard
          </Link>
          <span>Pengumuman</span>
          <span>Agenda</span>
          <span>Berita</span>
          <span>Galeri</span>
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">Dashboard</span>
            <h2>Panel pengelolaan website</h2>
          </div>
          <AdminLogoutButton />
        </header>
        <div className="admin-card-grid">
          {dashboardCards.map((card) => (
            <article className="admin-card" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <section className="admin-empty-state">
          <span className="admin-kicker">Berikutnya</span>
          <h3>Dashboard shell sudah siap untuk CRUD.</h3>
          <p>
            Setelah Firebase project dan akun admin dibuat, phase berikutnya bisa menambahkan sidebar route,
            form konten, dan koneksi Firestore.
          </p>
        </section>
      </section>
    </main>
  )
}
