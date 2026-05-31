import { AdminEmptyState } from './AdminEmptyState'
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
    <>
      <div className="admin-card-grid">
        {dashboardCards.map((card) => (
          <article className="admin-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
      <AdminEmptyState
        body="Setelah Firebase project dan akun admin dibuat, phase berikutnya bisa menambahkan form konten dan koneksi Firestore."
        kicker="Berikutnya"
        title="Dashboard shell sudah siap untuk CRUD."
      />
    </>
  )
}
